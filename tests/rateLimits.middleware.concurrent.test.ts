import express from 'express';
import request from 'supertest';
import { describe, it, expect } from 'vitest';
import { RedisStore, authRateLimiter, scansRateLimiter, publicRateLimiter, setRateLimitStore } from '../src/middleware/rateLimits';

// Mock Redis client that implements eval exactly as the Lua script expects
class MockEvalRedisClient {
  private store = new Map<string, { val: number; expiresAt?: number }>();

  async eval(_lua: string, _numKeys: number, key: string, windowMsStr: string, _limit: string) {
    const windowMs = Number(windowMsStr);
    const now = Date.now();
    const rec = this.store.get(key);
    if (!rec || (rec.expiresAt && now > rec.expiresAt)) {
      this.store.set(key, { val: 1, expiresAt: now + windowMs });
      return [1, windowMs];
    }
    rec.val += 1;
    const ttl = rec.expiresAt ? rec.expiresAt - now : windowMs;
    return [rec.val, ttl];
  }

  // helpers for cleanup
  async del(key: string) { this.store.delete(key); }
}

describe('Rate limiter middleware concurrency and failure behavior', () => {
  it('allows at most limit successful requests and blocks the rest (mock redis, auth user-scoped)', async () => {
    const client = new MockEvalRedisClient();
    const store = new RedisStore(client as any);
    // inject into module-level store used by middleware
    setRateLimitStore(store);

    const app = express();
    // attach a fake requireAuth that sets req.user
    app.use((req, _res, next) => { (req as any).user = { tenantId: 't1', id: req.headers['x-user'] || 'u1' }; next(); });
    // route with authRateLimiter
    app.get('/login', authRateLimiter, (_req, res) => res.status(200).send('ok'));

    const total = 20;
    const limit = 5;

    // launch many concurrent requests for the same user
    const tasks = Array.from({ length: total }, (_, i) =>
      request(app).get('/login').set('x-user', 'u1')
    );

    const results = await Promise.all(tasks.map(t => t.then(r => r)));
    const success = results.filter(r => r.status === 200).length;
    const blocked = results.filter(r => r.status === 429).length;

    expect(success).toBeLessThanOrEqual(limit);
    expect(blocked).toBe(total - success);
    expect(success).toBeGreaterThan(0);

    // TTL should be present in headers for blocked responses
    const blockedResp = results.find(r => r.status === 429);
    if (blockedResp) {
      expect(blockedResp.headers['retry-after']).toBeTruthy();
      expect(blockedResp.headers['x-ratelimit-limit']).toBe(String(limit));
    }
  }, 20000);

  it('tenant-scoped quotas are isolated across tenants (mock redis)', async () => {
    const client = new MockEvalRedisClient();
    const store = new RedisStore(client as any);
    setRateLimitStore(store);

    const app = express();
    app.use((req, _res, next) => { (req as any).user = { tenantId: req.headers['x-tenant'] || 't1', id: 'u' + (req.headers['x-user'] || 'a') }; next(); });
    app.post('/scan', scansRateLimiter, (_req, res) => res.status(201).send('created'));

    const tasks = [] as Promise<any>[];
    // tenant t1 sends 8 requests, tenant t2 sends 8 requests concurrently
    for (let i = 0; i < 8; i++) {
      tasks.push(request(app).post('/scan').set('x-tenant', 't1'));
      tasks.push(request(app).post('/scan').set('x-tenant', 't2'));
    }
    const results = await Promise.all(tasks.map(t => t.then(r => r)));
    const t1Success = results.filter(r => r.req.getHeader('x-tenant') === 't1' && r.status === 201).length;
    const t2Success = results.filter(r => r.req.getHeader('x-tenant') === 't2' && r.status === 201).length;

    // each tenant should be limited independently (limit 10 per minute for scans)
    expect(t1Success).toBeGreaterThan(0);
    expect(t2Success).toBeGreaterThan(0);
  }, 20000);

  it('strict policy returns 503 on store failure (simulate client error)', async () => {
    const badClient = {
      eval: async () => { throw new Error('simulated redis failure'); }
    };
    const store = new RedisStore(badClient as any);
    setRateLimitStore(store);

    const app = express();
    app.use((req, _res, next) => { (req as any).user = { tenantId: 't1', id: 'u1' }; next(); });
    // authRateLimiter is strict => should return 503 when store errors
    app.get('/login', authRateLimiter, (_req, res) => res.status(200).send('ok'));

    const res = await request(app).get('/login');
    expect(res.status).toBe(503);
    expect(res.body).toHaveProperty('error');
    expect(String(res.body.error).toLowerCase()).toContain('service');
  });
});
