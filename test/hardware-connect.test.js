/**
 * Live hardware connect — agent heartbeat, attest, provision
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createMarketplaceServer } from '../src/server.js';

function base(server) {
  return `http://localhost:${server.address().port}`;
}

async function req(server, method, path, body, apiKey) {
  const headers = { 'Content-Type': 'application/json' };
  if (apiKey) headers.Authorization = `Bearer ${apiKey}`;
  const opts = { method, headers };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const res = await fetch(`${base(server)}${path}`, opts);
  let json;
  try { json = await res.json(); } catch { json = null; }
  return { status: res.status, body: json };
}

function startServer() {
  const server = createMarketplaceServer();
  return new Promise(resolve => server.listen(0, () => resolve(server)));
}

function stopServer(server) {
  return new Promise(resolve => server.close(resolve));
}

function proof(nonce, fp) {
  return createHash('sha256').update(`${nonce}:${fp}`).digest('hex');
}

describe('Live hardware connect', async () => {
  let server, providerKey, customerKey, nodeId, listingId;

  before(async () => {
    server = await startServer();
    const p = await req(server, 'POST', '/v1/auth/register', {
      name: 'Live Prov', email: `live-p-${Date.now()}@test.com`, role: 'provider',
    });
    providerKey = p.body.api_key;
    const c = await req(server, 'POST', '/v1/auth/register', {
      name: 'Live Cust', email: `live-c-${Date.now()}@test.com`, role: 'customer',
    });
    customerKey = c.body.api_key;

    const n = await req(server, 'POST', '/v1/nodes', {
      hostname: 'live-gpu-1.example.com',
      gpu_model: 'H100-SXM5-80GB',
      gpu_count: 2,
      vram_gb_per_gpu: 80,
      interconnect: 'NVLink',
      region: 'us-east-1',
      live: true,
    }, providerKey);
    assert.equal(n.status, 201);
    assert.equal(n.body.live, true);
    nodeId = n.body.node_id;

    // Attest in setup so later tests are order-independent; heartbeat stays separate.
    const ch = await req(server, 'POST', `/v1/nodes/${nodeId}/attest/challenge`, {}, providerKey);
    assert.equal(ch.status, 201);
    const fp = 'test-hardware-fingerprint-abc';
    const v = await req(server, 'POST', '/v1/agent/attest/verify', {
      challenge_id: ch.body.challenge_id,
      nonce: ch.body.nonce,
      hardware_fingerprint: fp,
      proof: proof(ch.body.nonce, fp),
    }, providerKey);
    assert.equal(v.status, 200);
    assert.equal(v.body.attestation_status, 'attested');
  });

  after(async () => { await stopServer(server); });

  it('rejects stub attest on live nodes', async () => {
    const r = await req(server, 'POST', `/v1/nodes/${nodeId}/attest`, {}, providerKey);
    assert.equal(r.status, 400);
    assert.match(r.body.message, /agent attestation/i);
  });

  it('challenge + verify attests the node', async () => {
    // Already attested in before(); re-challenge should still work for a second proof cycle
    // only if we had a pending node — here we just confirm attested state via nodes list.
    const nodes = await req(server, 'GET', '/v1/nodes', undefined, providerKey);
    assert.equal(nodes.status, 200);
    const node = nodes.body.find(n => n.node_id === nodeId);
    assert.equal(node.attestation_status, 'attested');
    assert.equal(node.live, true);
    assert.equal(node.last_heartbeat_at, null);
  });

  it('live listing stays unavailable until heartbeat', async () => {
    const l = await req(server, 'POST', '/v1/listings', {
      node_id: nodeId, price_per_hour: '3.50', tags: ['training'],
    }, providerKey);
    assert.equal(l.status, 201);
    listingId = l.body.listing_id;
    assert.equal(l.body.live, true);
    assert.equal(l.body.available, false);

    const hb = await req(server, 'POST', '/v1/agent/heartbeat', {
      node_id: nodeId,
      agent_version: '0.1.0',
      hardware_fingerprint: 'test-hardware-fingerprint-abc',
    }, providerKey);
    assert.equal(hb.status, 200);
    assert.equal(hb.body.online, true);

    const got = await req(server, 'GET', `/v1/listings/${listingId}`);
    assert.equal(got.body.available, true);
    assert.equal(got.body.node_online, true);
  });

  it('customer reserve waits for agent provision ack', async () => {
    const r = await req(server, 'POST', '/v1/reservations', {
      listing_id: listingId, hours: 2,
    }, customerKey);
    assert.equal(r.status, 201);
    assert.equal(r.body.status, 'pending_provision');
    assert.equal(r.body.simulated, false);

    const pending = await req(server, 'GET', `/v1/agent/nodes/${nodeId}/pending`, undefined, providerKey);
    assert.equal(pending.status, 200);
    assert.ok(pending.body.some(j => j.reservation_id === r.body.reservation_id));

    const ack = await req(server, 'POST', `/v1/agent/reservations/${r.body.reservation_id}/ack`, {
      ssh_host: 'live-gpu-1.example.com',
      ssh_port: 22,
      ssh_user: 'neo',
      access_token: 'tok_test',
    }, providerKey);
    assert.equal(ack.status, 200);
    assert.equal(ack.body.status, 'active');
    assert.equal(ack.body.connection_info.ssh_user, 'neo');

    const customerView = await req(server, 'GET', `/v1/reservations/${r.body.reservation_id}`, undefined, customerKey);
    assert.equal(customerView.body.status, 'active');
    assert.equal(customerView.body.connection_info.ssh_host, 'live-gpu-1.example.com');
  });

  it('serves provider console', async () => {
    const res = await fetch(`${base(server)}/console.html`);
    assert.equal(res.status, 200);
    assert.match(await res.text(), /Provider console/i);
  });
});

describe('Persistence snapshot', async () => {
  it('persistNow captures registered accounts in the snapshot', async () => {
    const db = await import('../src/db.js');
    db.closePersistence();
    db.initPersistence(':memory:');
    const { registerAccount } = await import('../src/auth.js');
    const acc = registerAccount({
      name: 'Persist User',
      email: `persist-${Date.now()}@test.com`,
      role: 'customer',
    });
    db.persistNow();
    const snap = db.captureSnapshot();
    assert.ok(snap.accounts.some(a => a.api_key === acc.api_key));
    db.closePersistence();
  });
});
