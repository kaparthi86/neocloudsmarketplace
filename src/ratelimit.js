/**
 * In-memory per-IP limits for public writes.
 * On in production. Set RATE_LIMIT=0 to disable, RATE_LIMIT=1 to force on.
 */

const hits = new Map();

const RULES = {
  '/v1/auth/register': { limit: 8, windowMs: 60 * 60 * 1000 },
  '/v1/auth/recover': { limit: 5, windowMs: 60 * 60 * 1000 },
  '/v1/contact': { limit: 8, windowMs: 60 * 60 * 1000 },
  '/v1/provider-pilot': { limit: 8, windowMs: 60 * 60 * 1000 },
  '/v1/chat/completions': { limit: 60, windowMs: 60 * 1000 },
};

export function rateLimitEnabled() {
  if (process.env.RATE_LIMIT === '0') return false;
  if (process.env.RATE_LIMIT === '1') return true;
  return process.env.NODE_ENV === 'production';
}

export function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.trim()) return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

export function enforceRateLimit(req, pathname) {
  if (!rateLimitEnabled()) return;
  const rule = RULES[pathname];
  if (!rule) return;
  const key = `${clientIp(req)} ${pathname}`;
  const now = Date.now();
  const recent = (hits.get(key) || []).filter(t => now - t < rule.windowMs);
  if (recent.length >= rule.limit) {
    const err = new Error('Too many requests. Wait and try again.');
    err.status = 429;
    err.code = 'rate_limited';
    throw err;
  }
  recent.push(now);
  hits.set(key, recent);
}

export function resetRateLimits() {
  hits.clear();
}
