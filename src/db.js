/**
 * SQLite persistence — survives process restarts.
 * NEO_DB_PATH=:memory: (tests) or file path (default data/neo-clouds.sqlite).
 */

import { mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { store, getSeq, setSeq } from './store.js';

let db = null;
let persistTimer = null;

export function getDbPath() {
  if (process.env.NEO_DB_PATH) return process.env.NEO_DB_PATH;
  if (process.env.NODE_ENV === 'test') return ':memory:';
  return 'data/neo-clouds.sqlite';
}

export function initPersistence(path = getDbPath()) {
  if (db) return { path, loaded: true, already: true };
  if (path !== ':memory:') {
    mkdirSync(dirname(path), { recursive: true });
  }
  db = new DatabaseSync(path);
  db.exec(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS kv (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);
  loadSnapshot();
  return { path, loaded: true };
}

function readKv(key) {
  const row = db.prepare('SELECT value FROM kv WHERE key = ?').get(key);
  return row ? JSON.parse(row.value) : null;
}

function writeKv(key, value) {
  db.prepare(
    'INSERT INTO kv (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
  ).run(key, JSON.stringify(value));
}

export function loadSnapshot() {
  if (!db) return;
  const snap = readKv('snapshot');
  if (!snap) return;

  store.accounts.clear();
  store.accountsByEmail.clear();
  store.accountsById.clear();
  store.nodes.clear();
  store.listings.clear();
  store.reservations.clear();
  store.models.clear();
  store.usageEvents.length = 0;
  store.providerPilot.length = 0;
  store.contactMessages.length = 0;
  store.attestChallenges.clear();

  for (const a of snap.accounts || []) {
    store.accounts.set(a.api_key, a);
    store.accountsByEmail.set(a.email, a);
    store.accountsById.set(a.account_id, a);
  }
  for (const n of snap.nodes || []) store.nodes.set(n.node_id, n);
  for (const l of snap.listings || []) store.listings.set(l.listing_id, l);
  for (const r of snap.reservations || []) store.reservations.set(r.reservation_id, r);
  for (const m of snap.models || []) store.models.set(m.model_id, m);
  if (Array.isArray(snap.usageEvents)) store.usageEvents.push(...snap.usageEvents);
  if (Array.isArray(snap.providerPilot)) store.providerPilot.push(...snap.providerPilot);
  if (Array.isArray(snap.contactMessages)) store.contactMessages.push(...snap.contactMessages);
  for (const [id, c] of Object.entries(snap.attestChallenges || {})) {
    store.attestChallenges.set(id, c);
  }
  if (typeof snap.seq === 'number') setSeq(snap.seq);
}

export function captureSnapshot() {
  return {
    seq: getSeq(),
    accounts: [...store.accounts.values()],
    nodes: [...store.nodes.values()],
    listings: [...store.listings.values()],
    reservations: [...store.reservations.values()],
    models: [...store.models.values()],
    usageEvents: [...store.usageEvents],
    providerPilot: [...store.providerPilot],
    contactMessages: [...store.contactMessages],
    attestChallenges: Object.fromEntries(store.attestChallenges.entries()),
    saved_at: new Date().toISOString(),
  };
}

export function persistNow() {
  if (!db) return false;
  writeKv('snapshot', captureSnapshot());
  return true;
}

export function schedulePersist() {
  if (!db) return;
  if (persistTimer) return;
  persistTimer = setTimeout(() => {
    persistTimer = null;
    try { persistNow(); } catch (e) { console.error('persist failed:', e.message); }
  }, 50);
}

export function closePersistence() {
  if (persistTimer) {
    clearTimeout(persistTimer);
    persistTimer = null;
  }
  if (db) {
    try { persistNow(); } catch { /* ignore */ }
    db.close();
    db = null;
  }
}

export function isPersistenceEnabled() {
  return !!db;
}
