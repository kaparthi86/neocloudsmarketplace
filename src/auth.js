/**
 * Auth — API key registration and middleware
 */

import { randomBytes } from 'node:crypto';
import { store, makeId } from './store.js';
import { schedulePersist } from './db.js';

function generateKey(role) {
  const prefix = role === 'provider' ? 'nkp' : 'nck';
  return `${prefix}_${randomBytes(16).toString('hex')}`;
}

export function registerAccount({ name, email, role, api_key: fixedKey }) {
  if (!name || typeof name !== 'string') throw new Error('name is required');
  if (!email || typeof email !== 'string') throw new Error('email is required');
  const normalizedEmail = email.trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) throw new Error('email looks invalid');
  if (role !== 'provider' && role !== 'customer') throw new Error('role must be provider or customer');
  if (findAccountByEmail(normalizedEmail)) throw new Error('email already registered');

  const api_key = fixedKey || generateKey(role);
  if (typeof api_key !== 'string' || !api_key.startsWith(role === 'provider' ? 'nkp_' : 'nck_')) {
    throw new Error('api_key must use the correct role prefix');
  }
  if (store.accounts.has(api_key)) throw new Error('api_key already registered');

  const account = {
    account_id: makeId('acc'),
    name,
    email: normalizedEmail,
    role,
    api_key,
    email_verified: false,
    verify_token: randomBytes(16).toString('hex'),
    created_at: new Date().toISOString(),
  };
  store.accounts.set(api_key, account);
  store.accountsByEmail.set(normalizedEmail, account);
  store.accountsById.set(account.account_id, account);
  schedulePersist();
  return account;
}

export function findAccountByEmail(email) {
  if (!email || typeof email !== 'string') return null;
  const normalized = email.trim().toLowerCase();
  const direct = store.accountsByEmail.get(normalized);
  if (direct) return direct;
  for (const account of store.accountsByEmail.values()) {
    if (String(account.email).toLowerCase() === normalized) return account;
  }
  return null;
}

export function rotateApiKey(account) {
  const fresh = generateKey(account.role);
  store.accounts.delete(account.api_key);
  account.api_key = fresh;
  account.rotated_at = new Date().toISOString();
  store.accounts.set(fresh, account);
  schedulePersist();
  return account;
}

export function verifyEmailToken(token) {
  if (!token || typeof token !== 'string') {
    const err = new Error('token is required');
    err.status = 400;
    throw err;
  }
  const account = [...store.accounts.values()].find(a => a.verify_token === token);
  if (!account) {
    const err = new Error('verification token not found');
    err.status = 404;
    throw err;
  }
  account.email_verified = true;
  account.verified_at = new Date().toISOString();
  account.verify_token = null;
  schedulePersist();
  return { email: account.email, email_verified: true };
}

export function getAccountByKey(key) {
  return store.accounts.get(key) || null;
}

// ---------------------------------------------------------------------------
// Middleware helpers
// ---------------------------------------------------------------------------

export function authenticate(req) {
  const auth = req.headers['authorization'] || '';
  const match = auth.match(/^Bearer (.+)$/);
  if (!match) return null;
  return getAccountByKey(match[1]);
}

export function requireAuth(account) {
  if (!account) {
    const err = new Error('Missing or invalid API key');
    err.status = 401;
    err.code = 'unauthorized';
    throw err;
  }
}

export function requireRole(account, ...roles) {
  requireAuth(account);
  if (!roles.includes(account.role)) {
    const err = new Error(`Role '${account.role}' not allowed; need ${roles.join(' or ')}`);
    err.status = 403;
    err.code = 'forbidden';
    throw err;
  }
}
