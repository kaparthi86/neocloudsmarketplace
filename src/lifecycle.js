/**
 * Reservation clock — free listings when a hold ends or provision times out.
 */

import { store } from './store.js';
import { schedulePersist } from './db.js';

export function provisionTimeoutMs() {
  const n = Number(process.env.RESERVATION_PROVISION_TIMEOUT_MS || 15 * 60 * 1000);
  return Number.isFinite(n) && n > 0 ? n : 15 * 60 * 1000;
}

export function expireReservations(now = Date.now()) {
  let changed = 0;
  const timeout = provisionTimeoutMs();
  for (const r of store.reservations.values()) {
    const ends = new Date(r.ends_at).getTime();
    if (r.status === 'pending_provision') {
      const reserved = new Date(r.reserved_at).getTime();
      if (Number.isFinite(ends) && now >= ends) {
        r.status = 'cancelled';
        r.cancelled_at = new Date(now).toISOString();
        r.cancellation_reason = 'ended_before_provision';
        changed++;
      } else if (Number.isFinite(reserved) && now - reserved >= timeout) {
        r.status = 'cancelled';
        r.cancelled_at = new Date(now).toISOString();
        r.cancellation_reason = 'provision_timeout';
        changed++;
      }
    } else if (r.status === 'active' && Number.isFinite(ends) && now >= ends) {
      r.status = 'completed';
      r.completed_at = new Date(now).toISOString();
      changed++;
    }
  }
  if (changed) schedulePersist();
  return changed;
}
