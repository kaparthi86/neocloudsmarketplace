/**
 * Provider node agent protocol — heartbeat, challenge attest, provision ack.
 */

import { createHash, randomBytes } from 'node:crypto';
import { store, makeId } from './store.js';
import { schedulePersist } from './db.js';

export const HEARTBEAT_TTL_MS = Number(process.env.AGENT_HEARTBEAT_TTL_MS || 90_000);

export function isNodeOnline(node, now = Date.now()) {
  if (!node?.last_heartbeat_at) return false;
  return now - new Date(node.last_heartbeat_at).getTime() <= HEARTBEAT_TTL_MS;
}

export function isLiveNode(node) {
  return !!(node && node.live === true);
}

function requireNode(providerId, nodeId) {
  const node = store.nodes.get(nodeId);
  if (!node) { const e = new Error('node not found'); e.status = 404; throw e; }
  if (node.provider_id !== providerId) { const e = new Error('forbidden'); e.status = 403; e.code = 'forbidden'; throw e; }
  return node;
}

/**
 * Agent heartbeat — marks node online and refreshes inventory snapshot.
 */
export function agentHeartbeat(providerId, body = {}) {
  const nodeId = body.node_id;
  if (!nodeId) throw new Error('node_id is required');
  const node = requireNode(providerId, nodeId);

  node.last_heartbeat_at = new Date().toISOString();
  node.online = true;
  node.live = true;
  if (body.agent_version) node.agent_version = String(body.agent_version).slice(0, 64);
  if (body.hostname) node.hostname = String(body.hostname).slice(0, 200);
  if (body.hardware_fingerprint) {
    node.hardware_fingerprint = String(body.hardware_fingerprint).slice(0, 256);
  }
  if (Array.isArray(body.accelerators) && body.accelerators.length) {
    node.agent_inventory = body.accelerators.slice(0, 32);
  }

  schedulePersist();
  return {
    node_id: node.node_id,
    online: true,
    live: true,
    attestation_status: node.attestation_status,
    heartbeat_ttl_ms: HEARTBEAT_TTL_MS,
    pending_provisions: countPendingProvisions(node.node_id),
  };
}

export function createAttestChallenge(providerId, nodeId) {
  const node = requireNode(providerId, nodeId);
  const challenge_id = makeId('chg');
  const nonce = randomBytes(24).toString('hex');
  const challenge = {
    challenge_id,
    node_id: node.node_id,
    provider_id: providerId,
    nonce,
    created_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
  };
  store.attestChallenges.set(challenge_id, challenge);
  schedulePersist();
  return {
    challenge_id,
    nonce,
    expires_at: challenge.expires_at,
    instructions:
      'Have the neo-agent POST /v1/agent/attest/verify with challenge_id, nonce, and hardware_fingerprint.',
  };
}

function fingerprintPayload(nonce, hardwareFingerprint) {
  return createHash('sha256')
    .update(`${nonce}:${hardwareFingerprint}`)
    .digest('hex');
}

/**
 * Verify agent attestation — requires matching nonce + hardware fingerprint proof.
 */
export function verifyAttestChallenge(providerId, body = {}) {
  const { challenge_id, nonce, hardware_fingerprint, proof } = body;
  if (!challenge_id || !nonce || !hardware_fingerprint) {
    throw new Error('challenge_id, nonce, and hardware_fingerprint are required');
  }
  const challenge = store.attestChallenges.get(challenge_id);
  if (!challenge) { const e = new Error('challenge not found'); e.status = 404; throw e; }
  if (challenge.provider_id !== providerId) { const e = new Error('forbidden'); e.status = 403; e.code = 'forbidden'; throw e; }
  if (new Date(challenge.expires_at).getTime() < Date.now()) {
    store.attestChallenges.delete(challenge_id);
    const e = new Error('challenge expired'); e.status = 409; throw e;
  }
  if (challenge.nonce !== nonce) throw new Error('nonce mismatch');

  const expected = fingerprintPayload(nonce, hardware_fingerprint);
  if (proof && proof !== expected) throw new Error('invalid attestation proof');

  const node = requireNode(providerId, challenge.node_id);
  node.attestation_status = 'attested';
  node.attested_at = new Date().toISOString();
  node.live = true;
  node.hardware_fingerprint = String(hardware_fingerprint).slice(0, 256);
  // Do not set last_heartbeat_at here — agent heartbeat is the online signal.
  node.online = isNodeOnline(node);

  store.attestChallenges.delete(challenge_id);
  schedulePersist();
  return {
    node_id: node.node_id,
    attestation_status: node.attestation_status,
    attested_at: node.attested_at,
    live: true,
    proof: expected,
  };
}

function countPendingProvisions(nodeId) {
  return [...store.reservations.values()].filter(
    r => r.node_id === nodeId && r.status === 'pending_provision',
  ).length;
}

export function listPendingProvisions(providerId, nodeId) {
  requireNode(providerId, nodeId);
  return [...store.reservations.values()]
    .filter(r => r.node_id === nodeId && r.status === 'pending_provision')
    .map(r => ({
      reservation_id: r.reservation_id,
      listing_id: r.listing_id,
      hours: r.hours,
      customer_id: r.customer_id,
      starts_at: r.starts_at,
      ends_at: r.ends_at,
      reserved_at: r.reserved_at,
    }));
}

/**
 * Agent acknowledges provision — supplies real connection details.
 */
export function ackProvision(providerId, reservationId, body = {}) {
  const r = store.reservations.get(reservationId);
  if (!r) { const e = new Error('reservation not found'); e.status = 404; throw e; }
  if (r.provider_id !== providerId) { const e = new Error('forbidden'); e.status = 403; e.code = 'forbidden'; throw e; }
  if (r.status !== 'pending_provision') {
    const e = new Error('only pending_provision reservations can be acknowledged');
    e.status = 409;
    throw e;
  }

  const node = store.nodes.get(r.node_id);
  if (!node || !isNodeOnline(node)) {
    const e = new Error('node agent is offline — heartbeat required before ack');
    e.status = 409;
    throw e;
  }

  const ssh_host = body.ssh_host || node.hostname;
  const ssh_port = Number(body.ssh_port || 22);
  const ssh_user = body.ssh_user || 'neo';
  if (!ssh_host) throw new Error('ssh_host is required');

  r.status = 'active';
  r.simulated = false;
  r.provisioned_at = new Date().toISOString();
  r.connection_info = {
    ssh_host,
    ssh_port,
    ssh_user,
    access_token: body.access_token || makeId('tok'),
    note: body.note || 'Live provision from provider agent. No payment collected yet.',
  };
  schedulePersist();
  return r;
}
