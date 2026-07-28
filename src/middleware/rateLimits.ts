/**
 * Lightweight policy-based rate limiters with in-memory store for tests and a Redis
 * backing option for production (enabled when REDIS_URL or UPSTASH_REDIS_REST_URL is configured).
 *
 * Policies are keyed by policy name and a key derived from the request:
 * - For user-scoped policies use tenantId + userId when available (server-derived only)
 * - For tenant-scoped policies use tenantId when available, otherwise fallback to IP
 * - For public endpoints fallback to IP
 *
 * The store interface is simple: incr(key, windowMs, limit) -> {count, resetAt}
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

// Redis/Upstash adapter
let RedisClient: any = null;
let UpstashClient: any = null;
let hasIoredis = false;
let hasUpstash = false;
try {
  // prefer ioredis where REDIS_URL is set
  // dynamic import to avoid hard runtime failure if not installed (but we've installed it)
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const packageJsonRequire: any = require;
  try { RedisClient = packageJsonRequire('ioredis'); hasIoredis = true; } catch {}
  try { UpstashClient = packageJsonRequire('@upstash/redis'); hasUpstash = true; } catch {}
} catch (e) {
  // ignore
}

// Choose store based on environment. In tests and development we use deterministic in-memory store.
// In production, require an external shared store (REDIS_URL or UPSTASH variables). This prevents
// silent fallback to in-process memory when multiple instances are possible.
if (process.env.NODE_ENV === 'production' && !process.env.REDIS_URL && !process.env.UPSTASH_REDIS_REST_URL) {
  console.error('[RateLimits] Missing production store configuration: set REDIS_URL or UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN');
  throw new Error('Missing production rate-limit store configuration');
}

// Redis-backed store wrapper that uses a Redis client compatible with INCR/PEXPIRE/PTTL
export class RedisStore {
  private client: any;
  constructor(client: any) {
    this.client = client;
  }

  async incr(key: string, windowMs: number, limit: number): Promise<Counter> {
    const now = Date.now();
    try {
      // Atomic Lua: if key doesn't exist, set to 1 and set PX expiry; if exists and < limit, INCR; else return current
      const lua = `local cur = redis.call('GET', KEYS[1])\nif not cur then\n  redis.call('SET', KEYS[1], 1, 'PX', ARGV[1])\n  return {1, ARGV[1]}\nend\nlocal curNum = tonumber(cur)\nlocal lim = tonumber(ARGV[2])\nif curNum < lim then\n  local v = redis.call('INCR', KEYS[1])\n  local ttl = redis.call('PTTL', KEYS[1])\n  return {v, ttl}\nelse\n  local ttl = redis.call('PTTL', KEYS[1])\n  return {curNum, ttl}\nend`;

      let res: any;
      if (typeof this.client.eval === 'function') {
        // ioredis and many Redis clients: eval(script, numKeys, key, args...)
        res = await this.client.eval(lua, 1, key, windowMs, limit);
      } else if (typeof this.client.execute === 'function') {
        // Upstash REST client has execute for raw commands; try eval via execute
        res = await this.client.execute('EVAL', lua, '1', key, String(windowMs), String(limit));
      } else if (typeof this.client.evalsha === 'function') {
        res = await this.client.eval(lua, 1, key, windowMs, limit);
      } else {
        // Fallback to non-atomic path
        const count: number = Number(await this.client.incr(key));
        if (count === 1) {
          if (typeof this.client.pexpire === 'function') {
            await this.client.pexpire(key, windowMs);
          } else if (typeof this.client.expire === 'function') {
            await this.client.expire(key, Math.ceil(windowMs / 1000));
          }
        }
        let ttl = -1;
        if (typeof this.client.pttl === 'function') {
          ttl = Number(await this.client.pttl(key));
        } else if (typeof this.client.ttl === 'function') {
          const secs = Number(await this.client.ttl(key));
          ttl = Number.isNaN(secs) ? -1 : secs * 1000;
        }
        if (ttl < 0) ttl = windowMs;
        return { count: Math.min(count, limit), resetAt: now + ttl };
      }

      // normalize response: some clients return strings
      if (Array.isArray(res) && res.length >= 2) {
        const c = Number(res[0]);
        let ttl = Number(res[1]);
        if (ttl <= 0) ttl = windowMs;
        return { count: Math.min(c, limit), resetAt: now + Number(ttl) };

      }

      // Unexpected response
      throw new Error('Unexpected eval response: ' + String(res));
    } catch (err) {
      throw err;
    }
  }

  async get(key: string): Promise<Counter | undefined> {
    try {
      const val = await this.client.get(key);
      if (val === null || val === undefined) return undefined;
      const count = Number(val);
      if (Number.isNaN(count)) return undefined;
      let ttl = -1;
      if (typeof this.client.pttl === 'function') {
        ttl = Number(await this.client.pttl(key));
      } else if (typeof this.client.ttl === 'function') {
        const secs = Number(await this.client.ttl(key));
        ttl = Number.isNaN(secs) ? -1 : secs * 1000;
      }
      if (ttl < 0) ttl = 0;
      return { count, resetAt: Date.now() + ttl };
    } catch (err) {
      throw err;
    }
  }
}

// Initialize store: prefer REDIS_URL (ioredis) else UPSTASH_REDIS_REST_URL (Upstash)
let store: { incr: (k: string, windowMs: number, limit: number) => Promise<Counter>; get: (k: string) => Promise<Counter | undefined> };
if (process.env.REDIS_URL && hasIoredis) {
  try {
    const client = new RedisClient(process.env.REDIS_URL);
    store = new RedisStore(client);
    // simple ping to validate connection; do not block startup on failure in non-production
    client.ping().catch((err: any) => console.warn('[RateLimits] Redis ping failed, falling back to in-memory for now:', err));
  } catch (e) {
    console.warn('[RateLimits] Failed to initialize ioredis client, falling back to in-memory:', e);
    store = new InMemoryStore();
  }
} else if (process.env.UPSTASH_REDIS_REST_URL && hasUpstash) {
  try {
    // @upstash/redis exports createClient
    const upstashClient = UpstashClient?.Redis.fromEnv ? UpstashClient.Redis.fromEnv() : UpstashClient.createClient({ url: process.env.UPSTASH_REDIS_REST_URL, token: process.env.UPSTASH_REDIS_REST_TOKEN });
    store = new RedisStore(upstashClient);
    // validate ping
    upstashClient.ping?.().catch((err: any) => console.warn('[RateLimits] Upstash ping failed, falling back to in-memory for now:', err));
  } catch (e) {
    console.warn('[RateLimits] Failed to initialize Upstash client, falling back to in-memory:', e);
    store = new InMemoryStore();
  }
} else {
  store = new InMemoryStore();
}

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
      let counter: Counter;
      try {
        counter = await store.incr(storeKey, windowMs, limit);
      } catch (err) {
        // fail-open on transient store errors but log
        console.warn('[RateLimiter] Store error, allowing request:', err);
        return next();
      }

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
      // On failure of the rate limiter orchestration, fail open but log.
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
// Public limiter exported for test and public-route usage; server imports only what it needs.

export { InMemoryStore };

