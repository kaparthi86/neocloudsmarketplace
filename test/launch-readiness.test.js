/**
 * Launch-readiness: abuse limits, key recovery, expiry, attest proof, operator inbox.
 */

import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createMarketplaceServer } from '../src/server.js';
import { store } from '../src/store.js';
import { expireReservations } from '../src/lifecycle.js';
import { resetRateLimits } from '../src/ratelimit.js';

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

describe('Launch readiness', async () => {
  let server;

  before(async () => { server = await startServer(); });
  after(async () => { await stopServer(server); });

  it('rejects oversized public bodies', async () => {
    const r = await req(server, 'POST', '/v1/contact', {
      name: 'Big',
      email: 'big@example.com',
      message: 'x'.repeat(70_000),
    });
    assert.equal(r.status, 413);
  });

  it('does not return an API key from recover when mail is off', async () => {
    const email = `recover-${Date.now()}@example.com`;
    const reg = await req(server, 'POST', '/v1/auth/register', {
      name: 'Rec', email, role: 'customer',
    });
    assert.equal(reg.status, 201);
    assert.equal(reg.body.key_emailed, false);
    assert.equal(reg.body.verify_token, undefined);
    const rec = await req(server, 'POST', '/v1/auth/recover', { email });
    assert.equal(rec.status, 200);
    assert.equal(rec.body.emailed, false);
    assert.equal(rec.body.api_key, undefined);
    assert.match(rec.body.message, /not configured/i);
    const unknown = await req(server, 'POST', '/v1/auth/recover', { email: 'missing@example.com' });
    assert.equal(unknown.body.api_key, undefined);
  });

  it('rotates a key and rejects the old one', async () => {
    const reg = await req(server, 'POST', '/v1/auth/register', {
      name: 'Rot', email: `rot-${Date.now()}@example.com`, role: 'customer',
    });
    const oldKey = reg.body.api_key;
    const rot = await req(server, 'POST', '/v1/auth/rotate', {}, oldKey);
    assert.equal(rot.status, 200);
    assert.ok(rot.body.api_key.startsWith('nck_'));
    assert.notEqual(rot.body.api_key, oldKey);
    const oldMe = await req(server, 'GET', '/v1/auth/me', undefined, oldKey);
    assert.equal(oldMe.status, 401);
    const newMe = await req(server, 'GET', '/v1/auth/me', undefined, rot.body.api_key);
    assert.equal(newMe.status, 200);
    assert.equal(newMe.body.verify_token, undefined);
  });

  it('completes an active reservation after ends_at and frees the listing', async () => {
    const p = await req(server, 'POST', '/v1/auth/register', {
      name: 'ExpP', email: `expp-${Date.now()}@example.com`, role: 'provider',
    });
    const c = await req(server, 'POST', '/v1/auth/register', {
      name: 'ExpC', email: `expc-${Date.now()}@example.com`, role: 'customer',
    });
    const n = await req(server, 'POST', '/v1/nodes', {
      hostname: 'exp.example.com', gpu_model: 'A100', gpu_count: 1, vram_gb_per_gpu: 80,
      interconnect: 'PCIe', region: 'us-west-1',
    }, p.body.api_key);
    await req(server, 'POST', `/v1/nodes/${n.body.node_id}/attest`, {}, p.body.api_key);
    const l = await req(server, 'POST', '/v1/listings', {
      node_id: n.body.node_id, price_per_hour: '1.00',
    }, p.body.api_key);
    const created = await req(server, 'POST', '/v1/reservations', {
      listing_id: l.body.listing_id, hours: 1,
    }, c.body.api_key);
    assert.equal(created.body.status, 'active');
    const row = store.reservations.get(created.body.reservation_id);
    row.ends_at = new Date(Date.now() - 1000).toISOString();
    const changed = expireReservations();
    assert.ok(changed >= 1);
    const listed = await req(server, 'GET', `/v1/listings/${l.body.listing_id}`);
    assert.equal(listed.body.available, true);
    const mine = await req(server, 'GET', '/v1/reservations', undefined, c.body.api_key);
    const found = mine.body.find(r => r.reservation_id === created.body.reservation_id);
    assert.equal(found.status, 'completed');
  });

  it('cancels a live reserve that the agent never acks', async () => {
    const p = await req(server, 'POST', '/v1/auth/register', {
      name: 'LateP', email: `latep-${Date.now()}@example.com`, role: 'provider',
    });
    const c = await req(server, 'POST', '/v1/auth/register', {
      name: 'LateC', email: `latec-${Date.now()}@example.com`, role: 'customer',
    });
    const n = await req(server, 'POST', '/v1/nodes', {
      hostname: 'late.example.com', gpu_model: 'H100', gpu_count: 1, vram_gb_per_gpu: 80,
      interconnect: 'NVLink', region: 'us-east-1', live: true,
    }, p.body.api_key);
    const ch = await req(server, 'POST', `/v1/nodes/${n.body.node_id}/attest/challenge`, {}, p.body.api_key);
    const missing = await req(server, 'POST', '/v1/agent/attest/verify', {
      challenge_id: ch.body.challenge_id,
      nonce: ch.body.nonce,
      hardware_fingerprint: 'fp-late',
    }, p.body.api_key);
    assert.equal(missing.status, 400);
    assert.match(missing.body.message, /proof/i);
    const { createHash } = await import('node:crypto');
    const proof = createHash('sha256').update(`${ch.body.nonce}:fp-late`).digest('hex');
    const verified = await req(server, 'POST', '/v1/agent/attest/verify', {
      challenge_id: ch.body.challenge_id,
      nonce: ch.body.nonce,
      hardware_fingerprint: 'fp-late',
      proof,
    }, p.body.api_key);
    assert.equal(verified.status, 200);
    await req(server, 'POST', '/v1/agent/heartbeat', {
      node_id: n.body.node_id, hardware_fingerprint: 'fp-late',
    }, p.body.api_key);
    const l = await req(server, 'POST', '/v1/listings', {
      node_id: n.body.node_id, price_per_hour: '2.00',
    }, p.body.api_key);
    const created = await req(server, 'POST', '/v1/reservations', {
      listing_id: l.body.listing_id, hours: 2,
    }, c.body.api_key);
    assert.equal(created.body.status, 'pending_provision');
    store.reservations.get(created.body.reservation_id).reserved_at = new Date(Date.now() - 20 * 60 * 1000).toISOString();
    expireReservations();
    const view = await req(server, 'GET', `/v1/reservations/${created.body.reservation_id}`, undefined, c.body.api_key);
    assert.equal(view.body.status, 'cancelled');
    assert.equal(view.body.cancellation_reason, 'provision_timeout');
  });

  it('refuses heartbeat on a demo node', async () => {
    const p = await req(server, 'POST', '/v1/auth/register', {
      name: 'DemoP', email: `demop-${Date.now()}@example.com`, role: 'provider',
    });
    const n = await req(server, 'POST', '/v1/nodes', {
      hostname: 'demo.example.com', gpu_model: 'A10', gpu_count: 1, vram_gb_per_gpu: 24,
      interconnect: 'PCIe', region: 'eu-west-1',
    }, p.body.api_key);
    const hb = await req(server, 'POST', '/v1/agent/heartbeat', { node_id: n.body.node_id }, p.body.api_key);
    assert.equal(hb.status, 409);
    assert.equal(n.body.live, false);
  });

  it('serves the operator inbox and hides it without the operator key', async () => {
    const page = await fetch(`${base(server)}/admin`);
    assert.equal(page.status, 200);
    assert.match(await page.text(), /Operator inbox/);
    const locked = await req(server, 'GET', '/v1/admin/overview');
    assert.equal(locked.status, 503);
    process.env.ADMIN_API_KEY = 'op_test_key';
    const denied = await req(server, 'GET', '/v1/admin/overview', undefined, 'nope');
    assert.equal(denied.status, 401);
    const contact = await req(server, 'POST', '/v1/contact', {
      name: 'Inbox', email: `inbox-${Date.now()}@example.com`, message: 'Need capacity',
    });
    assert.equal(contact.status, 201);
    assert.equal(contact.body.emailed, false);
    assert.match(contact.body.message, /operator inbox/i);
    const open = await req(server, 'GET', '/v1/admin/overview', undefined, 'op_test_key');
    assert.equal(open.status, 200);
    assert.ok(open.body.contacts.some(c => c.name === 'Inbox'));
    assert.equal(Object.hasOwn(open.body.contacts[0], 'api_key'), false);
    delete process.env.ADMIN_API_KEY;
  });

  it('rate-limits registration when RATE_LIMIT=1', async () => {
    process.env.RATE_LIMIT = '1';
    resetRateLimits();
    let blocked = 0;
    for (let i = 0; i < 9; i++) {
      const r = await req(server, 'POST', '/v1/auth/register', {
        name: 'Spam', email: `spam-${Date.now()}-${i}@example.com`, role: 'customer',
      });
      if (r.status === 429) blocked++;
    }
    assert.ok(blocked >= 1);
    delete process.env.RATE_LIMIT;
    resetRateLimits();
  });
});
