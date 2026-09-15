/**
 * Public contact form — early-access inbound messages.
 */

import { store, makeId } from './store.js';
import { schedulePersist } from './db.js';

const VALID_INTENTS = ['provider', 'customer', 'other'];

function requireString(value, field, { max = 200 } = {}) {
  if (!value || typeof value !== 'string' || !value.trim()) {
    throw new Error(`${field} is required`);
  }
  const trimmed = value.trim();
  if (trimmed.length > max) throw new Error(`${field} must be at most ${max} characters`);
  return trimmed;
}

export function submitContact(body = {}) {
  const name = requireString(body.name, 'name', { max: 120 });
  const email = requireString(body.email, 'email', { max: 200 }).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('email looks invalid');
  const message = requireString(body.message, 'message', { max: 4000 });
  let intent = String(body.intent || 'other').toLowerCase();
  if (!VALID_INTENTS.includes(intent)) intent = 'other';

  const entry = {
    contact_id: makeId('ctc'),
    intent,
    name,
    email,
    message,
    created_at: new Date().toISOString(),
  };
  store.contactMessages.push(entry);
  schedulePersist();
  return {
    contact_id: entry.contact_id,
    message: 'Thanks — we received your note and will follow up by email.',
    created_at: entry.created_at,
  };
}

export function contactSummary() {
  return { count: store.contactMessages.length };
}
