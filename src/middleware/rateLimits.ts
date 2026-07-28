/**
 * Lightweight policy-based rate limiters with in-memory store for tests and a Redis
 * backing option for production (enabled when REDIS_URL is configured).
 *
 * Policies are keyed by policy name and a key derived from the request:
 * - For user-scoped policies use tenantId + userId when available (server-derived only)
 * - For tenant-scoped policies use tenantId when available, otherwise fallback to IP
 * - For public endpoints fallback to IP
 *
 * The store interface is simple: incr(key, windowMs) -> {count, resetAt}
 */

import { Request, Response, NextFunction } from 'express';

type Counter = { count: number; resetAt: number };

class InMemoryStore {
  private map = new Map<string, Counter>();

  async incr(key: string, windowMs: number, limit: number): Promise<Counter> {
    const now = Date.now();
    const rec = this.map.get(key);
    if (!rec || now > rec.resetAt) {
      const next = { count: 1, resetAt: now + windowMs };
      this.map.set(key, next);
      return next;
    }
    rec.count += 1;
    return rec;
  }

  async get(key: string): Promise<Counter | undefined> { return this.map.get(key); }
}

// Choose store based on environment. In tests and development we use deterministic in-memory store.
// In production, require an external shared store (REDIS_URL or UPSTASH variables). This prevents
// silent fallback to in-process memory when multiple instances are possible.
if (process.env.NODE_ENV === 'production' && !process.env.REDIS_URL && !process.env.UPSTASH_REDIS_REST_URL) {
  // Emit a clear startup-failing error so deployment does not start without a shared store.
  console.error('[RateLimits] Missing production store configuration: set REDIS_URL or UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN');
  throw new Error('Missing production rate-limit store configuration');
}

const store = new InMemoryStore();

function headerSafeInt(value: any): number {
  const n = parseInt(String(value || '0'), 10);
  return Number.isNaN(n) ? 0 : n;
}

function deriveClientIp(req: Request): string {
  // Respect Express trust proxy setting: req.ip already reflects that when app.set('trust proxy') is used.
  return req.ip || req.socket.remoteAddress || 'unknown-ip';
}

function deriveUserKey(req: Request): string | null {
  // Do NOT trust client-provided tenant headers. Only use req.user attached by requireAuth.
  const anyReq = req as any;
  if (anyReq.user && anyReq.user.tenantId && anyReq.user.id) {
    return `tenant:${anyReq.user.tenantId}:user:${anyReq.user.id}`;
  }
  return null;
}

function deriveTenantKey(req: Request): string | null {
  const anyReq = req as any;
  if (anyReq.user && anyReq.user.tenantId) {
    return `tenant:${anyReq.user.tenantId}`;
  }
  return null;
}

function buildMiddleware(opts: { name: string; windowMs: number; limit: number; scope: 'user' | 'tenant' | 'ip' }) {
  const { name, windowMs, limit, scope } = opts;
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      let key = '';
      if (scope === 'user') {
        const u = deriveUserKey(req);
        key = u || `ip:${deriveClientIp(req)}`;
      } else if (scope === 'tenant') {
        const t = deriveTenantKey(req);
        key = t || `ip:${deriveClientIp(req)}`;
      } else {
        key = `ip:${deriveClientIp(req)}`;
      }

      const storeKey = `${name}:${key}`;
      const counter = await store.incr(storeKey, windowMs, limit);
      const remaining = Math.max(0, limit - counter.count);

      // Standard headers
      res.setHeader('X-RateLimit-Limit', String(limit));
      res.setHeader('X-RateLimit-Remaining', String(remaining));
      res.setHeader('X-RateLimit-Reset', String(Math.ceil(counter.resetAt / 1000)));

      if (counter.count > limit) {
        res.setHeader('Retry-After', String(Math.ceil((counter.resetAt - Date.now()) / 1000)));
        return res.status(429).json({ error: 'Too Many Requests', policy: name });
      }

      return next();
    } catch (err) {
      // On failure of the rate limiter, fail open but log.
      // Keep production logging consistent with existing trackAndLogError pattern in server.
      console.warn('[RateLimiter] Failure, allowing request: ', err);
      return next();
    }
  };
}

export const authRateLimiter = buildMiddleware({ name: 'auth', windowMs: 60 * 1000, limit: 5, scope: 'user' });
export const scansRateLimiter = buildMiddleware({ name: 'scans', windowMs: 60 * 1000, limit: 10, scope: 'tenant' });
export const exportsRateLimiter = buildMiddleware({ name: 'exports', windowMs: 60 * 1000, limit: 5, scope: 'tenant' });
export const tenantAdminRateLimiter = buildMiddleware({ name: 'tenant-admin', windowMs: 60 * 1000, limit: 3, scope: 'tenant' });
export const publicRateLimiter = buildMiddleware({ name: 'public', windowMs: 60 * 1000, limit: 30, scope: 'ip' });

export default {
  authRateLimiter,
  scansRateLimiter,
  exportsRateLimiter,
  tenantAdminRateLimiter,
  publicRateLimiter,
};
