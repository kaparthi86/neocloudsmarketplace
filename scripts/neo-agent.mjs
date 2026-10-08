#!/usr/bin/env node
/**
 * Neo Clouds provider agent — run on real GPU/TPU hosts.
 *
 * Env:
 *   NEO_API_BASE     default http://localhost:8788
 *   NEO_API_KEY      provider key (nkp_...)
 *   NEO_NODE_ID      node_id from POST /v1/nodes with live:true
 *   NEO_SSH_HOST     host customers should SSH to (default: os hostname)
 *   NEO_SSH_PORT     default 22
 *   NEO_FINGERPRINT  optional stable hardware id
 *   NEO_SSH_PROVISION  set to 0 to skip creating the host user (dev only)
 *   NEO_AGENT_STATE  path for open-reservation state
 *
 * Flow:
 *   1) Register live node via API or console
 *   2) Run this agent (heartbeat + attest + per-reservation SSH user)
 *   3) Create listing on that node
 *   4) Customer reserves → agent creates a user and key, then acks
 *   5) When the reservation ends, the agent deletes that user
 */

import { hostname as osHostname, networkInterfaces, homedir, tmpdir } from 'node:os';
import { createHash as cryptoHash, randomBytes } from 'node:crypto';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdtemp, readFile, writeFile, rm, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';

const execFileAsync = promisify(execFile);

const API_BASE = (process.env.NEO_API_BASE || 'http://localhost:8788').replace(/\/$/, '');
const API_KEY = process.env.NEO_API_KEY;
const NODE_ID = process.env.NEO_NODE_ID;
const INTERVAL_MS = Number(process.env.NEO_HEARTBEAT_MS || 30_000);
const STATE_PATH = process.env.NEO_AGENT_STATE || join(homedir(), '.neo-clouds', 'agent-state.json');

if (!API_KEY || !NODE_ID) {
  console.error('Usage: NEO_API_KEY=nkp_... NEO_NODE_ID=node_... node scripts/neo-agent.mjs');
  process.exit(1);
}

function provisionEnabled() {
  return process.env.NEO_SSH_PROVISION !== '0';
}

function isManagedUser(name) {
  return typeof name === 'string' && /^neo[a-f0-9]{10}$/.test(name);
}

function reservationUsername(reservationId) {
  const hex = cryptoHash('sha256').update(String(reservationId)).digest('hex').slice(0, 10);
  return `neo${hex}`;
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

async function loadState() {
  try {
    const raw = await readFile(STATE_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== 'object' || typeof parsed.open !== 'object') return { open: {} };
    return parsed;
  } catch {
    return { open: {} };
  }
}

async function saveState(state) {
  await mkdir(dirname(STATE_PATH), { recursive: true });
  await writeFile(STATE_PATH, JSON.stringify(state, null, 2));
}

async function asRoot(args) {
  const opts = { timeout: 20_000, encoding: 'utf8' };
  if (typeof process.getuid === 'function' && process.getuid() === 0) {
    await execFileAsync(args[0], args.slice(1), opts);
    return;
  }
  await execFileAsync('sudo', ['-n', ...args], opts);
}

async function generateKeypair(reservationId) {
  const dir = await mkdtemp(join(tmpdir(), 'neo-ssh-'));
  const keyPath = join(dir, 'id');
  try {
    await execFileAsync('ssh-keygen', [
      '-t', 'ed25519', '-f', keyPath, '-N', '', '-q', '-C', `neo-${reservationId}`,
    ], { timeout: 20_000 });
    const privateKey = await readFile(keyPath, 'utf8');
    const publicKey = (await readFile(`${keyPath}.pub`, 'utf8')).trim();
    if (!publicKey.startsWith('ssh-ed25519 ') || publicKey.includes('\n')) {
      throw new Error('ssh-keygen returned an unexpected public key');
    }
    return { privateKey, publicKey };
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

async function openHostAccess(username, publicKey) {
  if (!isManagedUser(username)) throw new Error(`refusing to create user ${username}`);
  const tmp = join(tmpdir(), `neo-ak-${username}`);
  await writeFile(tmp, `${publicKey}\n`, { mode: 0o600 });
  try {
    try {
      await asRoot(['id', username]);
    } catch {
      await asRoot([
        'useradd', '--create-home', '--shell', '/bin/bash',
        '--comment', 'Neo Clouds reservation', username,
      ]);
    }
    const home = `/home/${username}/.ssh`;
    await asRoot(['install', '-d', '-m', '700', '-o', username, '-g', username, home]);
    await asRoot(['install', '-m', '600', '-o', username, '-g', username, tmp, `${home}/authorized_keys`]);
  } finally {
    await rm(tmp, { force: true });
  }
}

async function closeHostAccess(username) {
  if (!isManagedUser(username)) return;
  try {
    await asRoot(['userdel', '-r', username]);
  } catch (err) {
    const missing = /does not exist|unknown user|no such user/i.test(String(err.stderr || err.message || ''));
    if (!missing) throw err;
  }
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
    agent_version: '0.2.0',
    hostname: process.env.NEO_SSH_HOST || osHostname(),
    hardware_fingerprint: fingerprint,
    accelerators: [{ model: process.env.NEO_GPU_MODEL || 'unknown', count: Number(process.env.NEO_GPU_COUNT || 1) }],
  });
}

async function provisionPending(state) {
  const pending = await api('GET', `/v1/agent/nodes/${NODE_ID}/pending`);
  for (const job of pending) {
    const username = reservationUsername(job.reservation_id);
    console.log('Provisioning reservation', job.reservation_id, 'user', username);
    const keys = await generateKeypair(job.reservation_id);
    if (provisionEnabled()) await openHostAccess(username, keys.publicKey);
    try {
      const ack = await api('POST', `/v1/agent/reservations/${job.reservation_id}/ack`, {
        ssh_host: process.env.NEO_SSH_HOST || osHostname(),
        ssh_port: Number(process.env.NEO_SSH_PORT || 22),
        ssh_user: username,
        ssh_private_key: keys.privateKey,
        access_token: randomBytes(16).toString('hex'),
        note: provisionEnabled()
          ? 'SSH user created for this reservation only. It is removed when the reservation ends. No payment collected.'
          : 'NEO_SSH_PROVISION=0, so no host user was created. No payment collected.',
      });
      state.open[job.reservation_id] = { username, at: new Date().toISOString() };
      await saveState(state);
      console.log('Active:', ack.reservation_id, username);
    } catch (err) {
      if (provisionEnabled()) {
        await closeHostAccess(username).catch(closeErr => {
          console.error('rollback user failed:', closeErr.message);
        });
      }
      throw err;
    }
  }
}

async function releaseClosed(state) {
  const releases = await api('GET', `/v1/agent/nodes/${NODE_ID}/releases`);
  for (const job of releases) {
    const username = state.open[job.reservation_id]?.username || job.ssh_user;
    if (provisionEnabled() && isManagedUser(username)) {
      console.log('Removing SSH user', username, 'for', job.reservation_id);
      await closeHostAccess(username);
    }
    await api('POST', `/v1/agent/reservations/${job.reservation_id}/revoke`, {});
    delete state.open[job.reservation_id];
    await saveState(state);
  }
}

async function tick(fingerprint, state) {
  const hb = await heartbeat(fingerprint);
  console.log(`[${new Date().toISOString()}] heartbeat ok · pending=${hb.pending_provisions} · attest=${hb.attestation_status}`);
  if (hb.attestation_status !== 'attested') {
    await ensureAttested(fingerprint);
  }
  await provisionPending(state);
  await releaseClosed(state);
}

const fingerprint = defaultFingerprint();
const state = await loadState();
console.log('Neo Clouds agent starting');
console.log(' API ', API_BASE);
console.log(' NODE', NODE_ID);
console.log(' FP  ', fingerprint.slice(0, 16) + '…');
console.log(' SSH ', provisionEnabled() ? 'per-reservation user' : 'provision disabled');

await ensureAttested(fingerprint);
await tick(fingerprint, state);
setInterval(() => {
  tick(fingerprint, state).catch(err => console.error('tick failed:', err.message));
}, INTERVAL_MS);
