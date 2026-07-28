import { describe, it, expect } from 'vitest';
import { RedisStore } from '../src/middleware/rateLimits';

// Attempt to run against real Redis if env provided
const REDIS_URL = process.env.REDIS_URL;
const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;

// Minimal in-test mock client implementing incr/pexpire/pttl/get
class MockRedisClient {
  private store = new Map<string, { val: number; expiresAt?: number }>();

  async incr(key: string) {
    const now = Date.now();
    const rec = this.store.get(key);
    if (!rec || (rec.expiresAt && now > rec.expiresAt)) {
      this.store.set(key, { val: 1 });
      return 1;
    }
    rec.val += 1;
    return rec.val;
  }

  async pexpire(key: string, ms: number) {
    const rec = this.store.get(key);
    const now = Date.now();
    if (!rec) {
      this.store.set(key, { val: 0, expiresAt: now + ms });
      return 1;
    }
    rec.expiresAt = now + ms;
    return 1;
  }

  async pttl(key: string) {
    const rec = this.store.get(key);
    if (!rec || !rec.expiresAt) return -2; // key does not exist
    const ttl = rec.expiresAt - Date.now();
    return ttl < 0 ? -2 : ttl;
  }

  async get(key: string) {
    const rec = this.store.get(key);
    if (!rec) return null;
    return String(rec.val);
  }
}

describe('RedisStore adapter (mock or real when available)', () => {
  it('works with mock Redis client: incr sets expiry and pttl', async () => {
    const client = new MockRedisClient();
    const store = new RedisStore(client as any);
    const k = `test:mock:${Date.now()}`;
    const c1 = await store.incr(k, 1000, 5);
    expect(c1.count).toBe(1);
    expect(c1.resetAt).toBeGreaterThan(Date.now());

    const c2 = await store.incr(k, 1000, 5);
    expect(c2.count).toBe(2);

    const got = await store.get(k);
    expect(got).toBeDefined();
    expect(got!.count).toBe(2);
  });

  // If real Redis is configured, run a basic smoke test against it
  if (REDIS_URL || UPSTASH_URL) {
    it('connects to real redis when configured and performs incr/pttl', async () => {
      // The RedisStore constructor will be used in module when env is provided; here we attempt a connection
      // Create client depending on env
      let client: any;
      if (REDIS_URL) {
        const IORedis = require('ioredis');
        client = new IORedis(REDIS_URL);
      } else {
        const { Redis } = require('@upstash/redis');
        client = REDIS_URL ? new (require('ioredis'))(REDIS_URL) : Redis.fromEnv();
      }
      const store = new RedisStore(client);
      const k = `test:real:${Date.now()}`;
      const r1 = await store.incr(k, 2000, 5);
      expect(r1.count).toBeGreaterThanOrEqual(1);
      const r2 = await store.get(k);
      expect(r2).toBeDefined();
      // cleanup
      try { await client.del(k); } catch {}
      try { client.disconnect?.(); } catch {}
    });
  }
});
