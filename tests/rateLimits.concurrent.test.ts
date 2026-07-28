import { describe, it, expect } from 'vitest';
import { RedisStore } from '../src/middleware/rateLimits';

// Use same Mock client from rateLimits.redis.test or real Redis when available
class MockRedisClientForConcurrent {
  private store = new Map<string, { val: number; expiresAt?: number }>();

  async eval(_lua: string, _numKeys: number, key: string, windowMs: number, limit: number) {
    const now = Date.now();
    const rec = this.store.get(key);
    if (!rec || (rec.expiresAt && now > rec.expiresAt)) {
      this.store.set(key, { val: 1, expiresAt: now + Number(windowMs) });
      return [1, Number(windowMs)];
    }
    const cur = rec.val;
    if (cur < Number(limit)) {
      rec.val += 1;
      const ttl = rec.expiresAt ? rec.expiresAt - now : Number(windowMs);
      return [rec.val, ttl];
    }
    const ttl = rec.expiresAt ? rec.expiresAt - now : Number(windowMs);
    return [cur, ttl];
  }

  async get(_k: string) { return null; }
}

describe('RedisStore concurrency', () => {
  it('does not increment beyond the configured limit under concurrent calls (mock)', async () => {
    const client = new MockRedisClientForConcurrent();
    const store = new RedisStore(client as any);
    const key = `concurrent:mock:${Date.now()}`;
    const windowMs = 1000;
    const limit = 5;

    // start many concurrent increments
    const tasks = Array.from({ length: 20 }, () => store.incr(key, windowMs, limit));
    const results = await Promise.all(tasks);

    const counts = results.map(r => r.count);
    const max = Math.max(...counts);
    expect(max).toBeLessThanOrEqual(limit);
    expect(counts.some(c => c === limit)).toBe(true);
  });

  // If a real Redis is available, exercise the same concurrent behavior against it
  if (process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL) {
    it('does not increment beyond configured limit under concurrent calls (real redis)', async () => {
      const REDIS_URL = process.env.REDIS_URL;
      let client: any;
      if (REDIS_URL) {
        const IORedis = require('ioredis');
        client = new IORedis(REDIS_URL);
      } else {
        // upstash
        const { Redis } = require('@upstash/redis');
        client = Redis.fromEnv();
      }
      const store = new RedisStore(client as any);
      const key = `concurrent:real:${Date.now()}`;
      const windowMs = 10000;
      const limit = 5;

      const tasks = Array.from({ length: 50 }, () => store.incr(key, windowMs, limit));
      const results = await Promise.all(tasks);
      const counts = results.map(r => r.count);
      const max = Math.max(...counts);
      expect(max).toBeLessThanOrEqual(limit);
      expect(counts.some(c => c === limit)).toBe(true);

      // cleanup
      try { await client.del(key); } catch (e) {}
      try { client.disconnect?.(); } catch (e) {}
    });
  }
});
