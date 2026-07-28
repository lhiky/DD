import express from 'express';
import request from 'supertest';
import { describe, it, expect, beforeEach } from 'vitest';
import { authRateLimiter, scansRateLimiter, tenantAdminRateLimiter, publicRateLimiter } from '../src/middleware/rateLimits';

function makeAppWithUser(user: any) {
  const app = express();
  // Do not trust arbitrary X-Forwarded-For headers in tests; simulate deployment where trust proxy is only enabled when configured explicitly.
  app.set('trust proxy', false);
  // Attach a fake auth middleware that sets req.user to simulate authenticated requests
  app.use((req: any, _res, next) => {
    req.user = user;
    next();
  });
  app.get('/test/auth', authRateLimiter, (_req, res) => res.status(200).json({ ok: true }));
  app.post('/test/scans', express.json(), scansRateLimiter, (_req, res) => res.status(201).json({ created: true }));
  app.post('/test/scan-run', scansRateLimiter, (_req, res) => res.status(200).json({ run: true }));

  // Admin protected route that checks role after rate limiter
  app.post('/test/admin-verify', tenantAdminRateLimiter, (req: any, res) => {
    if (!req.user || !req.user.role || !req.user.role.includes('Admin')) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return res.status(200).json({ verified: true });
  });

  // Public route using IP-scoped limiter
  app.post('/test/public', publicRateLimiter, (_req, res) => res.status(200).json({ ok: true }));
  return app;
}

describe('rateLimits', () => {
  beforeEach(() => {
    // no-op: in-memory store is reset by new process / Map retained per module but tests run in same process.
    // To ensure fresh tests, require cache clearing by re-importing the module would be needed; instead
    // the tests run sequentially and use independent keys (different users/tenants) to avoid interference.
  });

  it('allows requests below auth limit and blocks after exceed', async () => {
    const user = { tenantId: 't-1', id: 'u-1' };
    const app = makeAppWithUser(user);

    // limit for authRateLimiter is 5 per minute (see implementation)
    for (let i = 1; i <= 5; i++) {
      const res = await request(app).get('/test/auth');
      expect(res.status).toBe(200);
      expect(res.headers).toHaveProperty('x-ratelimit-limit');
      expect(res.headers).toHaveProperty('x-ratelimit-remaining');
    }

    const blocked = await request(app).get('/test/auth');
    expect(blocked.status).toBe(429);
    expect(blocked.headers).toHaveProperty('retry-after');
    expect(blocked.body).toHaveProperty('error');
  });

  it('user isolation: different users do not share user-scoped quota', async () => {
    const app1 = makeAppWithUser({ tenantId: 't-1', id: 'u-A' });
    const app2 = makeAppWithUser({ tenantId: 't-1', id: 'u-B' });

    for (let i = 0; i < 5; i++) await request(app1).get('/test/auth');
    const resA = await request(app1).get('/test/auth');
    expect(resA.status).toBe(429);

    // Other user should still be allowed
    const resB = await request(app2).get('/test/auth');
    expect(resB.status).toBe(200);
  });

  it('tenant-scoped scans limit isolates tenants and blocks when exceeded', async () => {
    const tenant1 = { tenantId: 'tenant-1', id: 'alice' };
    const tenant2 = { tenantId: 'tenant-2', id: 'bob' };
    const app1 = makeAppWithUser(tenant1);
    const app2 = makeAppWithUser(tenant2);

    for (let i = 0; i < 10; i++) {
      const r = await request(app1).post('/test/scans').send({ target: 'x' });
      expect(r.status === 201 || r.status === 200).toBeTruthy();
    }
    const blocked = await request(app1).post('/test/scans').send({ target: 'x' });
    expect(blocked.status).toBe(429);

    // tenant2 still allowed
    const ok = await request(app2).post('/test/scans').send({ target: 'y' });
    expect(ok.status).toBe(201);
  });

  it('role-based authorization is enforced after limiter and unauthorized users are still denied', async () => {
    const nonAdmin = { tenantId: 't-1', id: 'u-1', role: ['User'] };
    const app = makeAppWithUser(nonAdmin);
    const res = await request(app).post('/test/admin-verify');
    expect(res.status).toBe(403);
  });

  it('public ip-scoped limiter uses request ip and is not bypassed by X-Forwarded-For when trust proxy is configured', async () => {
    const app = makeAppWithUser({});
    // Send many requests from same supertest client (same ip)
    for (let i = 0; i < 30; i++) {
      const r = await request(app).post('/test/public').set('X-Forwarded-For', '1.2.3.4');
      expect(r.status).toBe(200);
    }
    const blocked = await request(app).post('/test/public').set('X-Forwarded-For', '9.9.9.9');
    // Depending on the environment, the test client IP resolves to same source; ensure blocked
    expect(blocked.status).toBe(429);
  });

  it('forged tenant headers do not change limiter key', async () => {
    const user = { tenantId: 't-abc', id: 'u-1' };
    const app = makeAppWithUser(user);
    for (let i = 0; i < 5; i++) await request(app).get('/test/auth').set('X-Tenant-Id', 't-evil');
    const blocked = await request(app).get('/test/auth').set('X-Tenant-Id', 't-evil');
    expect(blocked.status).toBe(429);
  });
});
