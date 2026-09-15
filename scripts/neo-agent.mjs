#!/usr/bin/env node
/**
 * Neo Clouds provider agent — run on real GPU/TPU hosts.
 *
 * Env:
 *   NEO_API_BASE   default http://localhost:8788
 *   NEO_API_KEY    provider key (nkp_...)
 *   NEO_NODE_ID    node_id from POST /v1/nodes with live:true
 *   NEO_SSH_HOST   host customers should SSH to (default: os hostname)
 *   NEO_SSH_USER   default neo
 *   NEO_SSH_PORT   default 22
 *   NEO_FINGERPRINT optional stable hardware id
 *
 * Flow:
 *   1) Register live node via API or console
 *   2) Run this agent (heartbeat + attest + provision ack)
 *   3) Create listing on that node
 *   4) Customer reserves → agent acks with connection info
 */

import { hostname as osHostname, networkInterfaces } from 'node:os';
import { createHash as cryptoHash, randomBytes } from 'node:crypto';

const API_BASE = (process.env.NEO_API_BASE || 'http://localhost:8788').replace(/\/$/, '');
const API_KEY = process.env.NEO_API_KEY;
const NODE_ID = process.env.NEO_NODE_ID;
const INTERVAL_MS = Number(process.env.NEO_HEARTBEAT_MS || 30_000);

if (!API_KEY || !NODE_ID) {
  console.error('Usage: NEO_API_KEY=nkp_... NEO_NODE_ID=node_... node scripts/neo-agent.mjs');
  process.exit(1);
}

function defaultFingerprint() {
  if (process.env.NEO_FINGERPRINT) return process.env.NEO_FINGERPRINT;
  const nets = networkInterfaces();
  const macs = Object.values(nets).flat().filter(Boolean).map(n => n.mac).filter(m => m && m !== '00:00:00:00:00:00');
  const raw = `${osHostname()}|${macs.sort().join(',')}`;
  return cryptoHash('sha256').update(raw).digest('hex');
}

async function api(method, path, body) {
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${API_KEY}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error(data.message || data.error || `HTTP ${res.status}`);
    err.status = res.status;
    err.body = data;
    throw err;
  }
  return data;
}

function proof(nonce, fingerprint) {
  return cryptoHash('sha256').update(`${nonce}:${fingerprint}`).digest('hex');
}

async function ensureAttested(fingerprint) {
  const meNodes = await api('GET', '/v1/nodes');
  const node = meNodes.find(n => n.node_id === NODE_ID);
  if (!node) throw new Error(`node ${NODE_ID} not found for this provider key`);
  if (node.attestation_status === 'attested') return node;

  console.log('Requesting attest challenge…');
  const ch = await api('POST', `/v1/nodes/${NODE_ID}/attest/challenge`, {});
  const verified = await api('POST', '/v1/agent/attest/verify', {
    challenge_id: ch.challenge_id,
    nonce: ch.nonce,
    hardware_fingerprint: fingerprint,
    proof: proof(ch.nonce, fingerprint),
  });
  console.log('Attested:', verified.attested_at);
  return verified;
}

async function heartbeat(fingerprint) {
  return api('POST', '/v1/agent/heartbeat', {
    node_id: NODE_ID,
    agent_version: '0.1.0',
    hostname: process.env.NEO_SSH_HOST || osHostname(),
    hardware_fingerprint: fingerprint,
    accelerators: [{ model: process.env.NEO_GPU_MODEL || 'unknown', count: Number(process.env.NEO_GPU_COUNT || 1) }],
  });
}

async function provisionPending() {
  const pending = await api('GET', `/v1/agent/nodes/${NODE_ID}/pending`);
  for (const job of pending) {
    console.log('Provisioning reservation', job.reservation_id);
    const ack = await api('POST', `/v1/agent/reservations/${job.reservation_id}/ack`, {
      ssh_host: process.env.NEO_SSH_HOST || osHostname(),
      ssh_port: Number(process.env.NEO_SSH_PORT || 22),
      ssh_user: process.env.NEO_SSH_USER || 'neo',
      access_token: randomBytes(16).toString('hex'),
      note: 'Provisioned by neo-agent. Ensure SSH user access is configured on this host.',
    });
    console.log('Active:', ack.reservation_id, ack.connection_info);
  }
}

async function tick(fingerprint) {
  const hb = await heartbeat(fingerprint);
  console.log(`[${new Date().toISOString()}] heartbeat ok · pending=${hb.pending_provisions} · attest=${hb.attestation_status}`);
  if (hb.attestation_status !== 'attested') {
    await ensureAttested(fingerprint);
  }
  await provisionPending();
}

const fingerprint = defaultFingerprint();
console.log('Neo Clouds agent starting');
console.log(' API ', API_BASE);
console.log(' NODE', NODE_ID);
console.log(' FP  ', fingerprint.slice(0, 16) + '…');

await ensureAttested(fingerprint);
await tick(fingerprint);
setInterval(() => {
  tick(fingerprint).catch(err => console.error('tick failed:', err.message));
}, INTERVAL_MS);
