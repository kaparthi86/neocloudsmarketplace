/**
 * Operator inbox — waitlist, contact, node liveness, open reservations.
 * Never returns API keys.
 */

import { store } from './store.js';
import { isNodeOnline } from './agent.js';
import { isMailConfigured } from './mail.js';
import { getDbPath, isPersistenceEnabled } from './db.js';
import { provisionTimeoutMs } from './lifecycle.js';

export function adminOverview(now = Date.now()) {
  const timeout = provisionTimeoutMs();
  const nodes = [...store.nodes.values()].map(n => ({
    node_id: n.node_id,
    hostname: n.hostname,
    accelerator_model: n.accelerator_model || n.gpu_model,
    region: n.region,
    live: n.live === true,
    online: isNodeOnline(n, now),
    attestation_status: n.attestation_status,
    last_heartbeat_at: n.last_heartbeat_at,
  }));
  const reservations = [...store.reservations.values()]
    .filter(r => r.status === 'active' || r.status === 'pending_provision')
    .map(r => ({
      reservation_id: r.reservation_id,
      listing_id: r.listing_id,
      node_id: r.node_id,
      status: r.status,
      simulated: r.simulated,
      reserved_at: r.reserved_at,
      ends_at: r.ends_at,
      provision_late: r.status === 'pending_provision'
        && now - new Date(r.reserved_at).getTime() > 5 * 60 * 1000,
    }));

  const alerts = [];
  if (!isMailConfigured()) alerts.push('Email delivery is not configured. Inbound notes stay in this inbox only.');
  if (!process.env.ADMIN_API_KEY) alerts.push('ADMIN_API_KEY is not set.');
  if (!isPersistenceEnabled()) alerts.push('Persistence is off. A restart drops accounts and inbox rows.');
  for (const n of nodes) {
    if (n.live && !n.online) alerts.push(`Live node ${n.node_id} has no fresh heartbeat.`);
  }
  for (const r of reservations) {
    if (r.provision_late) alerts.push(`Reservation ${r.reservation_id} is still waiting on the provider agent.`);
  }

  return {
    mailConfigured: isMailConfigured(),
    persistenceEnabled: isPersistenceEnabled(),
    persistencePath: getDbPath(),
    provisionTimeoutMs: timeout,
    accounts: store.accounts.size,
    listings: store.listings.size,
    alerts,
    contacts: store.contactMessages.map(c => ({
      contact_id: c.contact_id,
      intent: c.intent,
      name: c.name,
      email: c.email,
      message: c.message,
      created_at: c.created_at,
      emailed: c.emailed === true,
    })),
    waitlist: store.providerPilot.map(p => ({
      interest_id: p.interest_id,
      name: p.name,
      email: p.email,
      company: p.company,
      region: p.region,
      accelerator_type: p.accelerator_type,
      accelerator_model: p.accelerator_model,
      accelerator_count: p.accelerator_count,
      memory_gb_per_chip: p.memory_gb_per_chip,
      price_per_hour: p.price_per_hour,
      workloads: p.workloads,
      notes: p.notes,
      status: p.status,
      created_at: p.created_at,
      emailed: p.emailed === true,
    })),
    nodes,
    reservations,
  };
}
