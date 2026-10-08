/**
 * Buyer and operator mail for live reservation transitions.
 * Simulated reservations are not mailed. Mail is skipped when delivery is off.
 */

import { store } from './store.js';
import { emailCustomer, notifyOperator } from './mail.js';

function copyFor(r, event) {
  const id = r.reservation_id;
  if (event === 'access_ready') {
    const host = r.connection_info?.ssh_host;
    const user = r.connection_info?.ssh_user;
    return {
      subject: `Neo Clouds access is ready (${id})`,
      text: [
        'The provider agent opened access for your reservation.',
        host && user ? `SSH: ${user}@${host}` : 'Open My reservations to copy the SSH user and key.',
        'The private key is on the reservation page. It is not included in this email.',
        `Reservation: ${id}`,
        'Payments are not collected.',
      ].join('\n'),
    };
  }
  const lines = {
    provision_timeout: 'The provider agent did not acknowledge this reservation in time, so the hold is closed.',
    ended_before_provision: 'The reservation window ended before the provider agent opened access.',
    agent_offline: 'The provider agent went quiet, so this hold is closed.',
    cancelled: 'This live reservation was cancelled.',
  };
  const lead = lines[event];
  if (!lead) return null;
  return {
    subject: event === 'cancelled'
      ? `Neo Clouds reservation cancelled (${id})`
      : `Neo Clouds reservation ended (${id})`,
    text: [
      lead,
      r.cancellation_reason ? `Reason: ${r.cancellation_reason}` : '',
      `Reservation: ${id}`,
      'Payments are not collected.',
    ].filter(Boolean).join('\n'),
  };
}

export function mailReservationEvent(r, event) {
  if (!r || r.simulated) return;
  const message = copyFor(r, event);
  if (!message) return;
  const email = store.accountsById.get(r.customer_id)?.email;
  if (email) emailCustomer(email, message);
  if (event === 'provision_timeout') {
    notifyOperator(message).catch(err => {
      console.error('operator mail failed:', err.message);
    });
  }
}
