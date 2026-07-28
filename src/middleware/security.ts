/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Request, Response, NextFunction } from 'express';
import { adminAuth, setUserCustomClaims } from '../lib/firebase-admin.ts';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { eq } from 'drizzle-orm';

// Extend Express Request type
export interface AuthenticatedRequest extends Request {
  user?: {
    id: number;
    uid: string;
    email: string;
    tenantId: string;
    role: string;
    emailVerified: boolean;
  };
}

// 1. Shared-store aware rate limiter to prevent API abuse
let rateLimitWindowMs = 60 * 1000; // 1 minute
let maxRequestsPerWindow = 100;    // max 100 requests per window
const isTestMode = () => process.env.NODE_ENV !== 'production';

// For tests: allow overriding rate limit configuration
export function setRateLimiterConfig(opts: { windowMs?: number; maxRequests?: number }) {
  if (!isTestMode()) {
    throw new Error('setRateLimiterConfig is only available in test mode');
  }
  if (typeof opts.windowMs === 'number') rateLimitWindowMs = opts.windowMs;
  if (typeof opts.maxRequests === 'number') maxRequestsPerWindow = opts.maxRequests;
}

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

interface RateLimitStore {
  incr(key: string, windowMs: number, limit: number): Promise<RateLimitRecord>;
  get?(key: string): Promise<RateLimitRecord | undefined | null>;
}

// Simple in-memory store used for development and tests
class InMemoryStore implements RateLimitStore {
  private map = new Map<string, { count: number; resetAt: number }>();

  async incr(key: string, windowMs: number, limit: number) {
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

  async get(key: string) {
    return this.map.get(key);
  }
}

interface AtomicRateLimitClient {
  increment(script: string, key: string, windowMs: number, limit: number): Promise<unknown>;
}

export class IORedisAtomicClient implements AtomicRateLimitClient {
  constructor(
    private readonly client: {
      eval(script: string, numKeys: number, ...args: Array<string | number>): Promise<unknown>;
    }
  ) {}

  increment(script: string, key: string, windowMs: number, limit: number) {
    return this.client.eval(script, 1, key, String(windowMs), String(limit));
  }
}

export function createAtomicRateLimitClient(provider: 'ioredis' | 'upstash', client: any): AtomicRateLimitClient {
  if (provider === 'ioredis') {
    if (!client || typeof client.eval !== 'function') {
      throw new Error('Invalid ioredis client; expected eval(script, numKeys, ...args)');
    }
    return new IORedisAtomicClient(client);
  }

  // Upstash support has been removed from the production path. Keep the type signature
  // so tests may assert rejection of unsupported configurations, but do not attempt
  // to provide a runtime adapter here.
  if (provider === 'upstash') {
    throw new Error('Upstash provider is not supported in this deployment');
  }

  throw new Error(`Unsupported rate limit provider: ${provider}`);
}

export class RedisStore implements RateLimitStore {
  private readonly lua =
    `local count = redis.call("INCR", KEYS[1])\n` +
    `local ttl = redis.call("PTTL", KEYS[1])\n` +
    `if count == 1 or ttl < 0 then\n` +
    `  redis.call("PEXPIRE", KEYS[1], ARGV[1])\n` +
    `  ttl = tonumber(ARGV[1])\n` +
    `end\n` +
    `return {count, ttl}`;

  constructor(
    private readonly atomicClient: AtomicRateLimitClient,
    private readonly rawClient?: {
      get?: (key: string) => Promise<unknown>;
      pttl?: (key: string) => Promise<unknown>;
    }
  ) {}

  async incr(key: string, windowMs: number, limit: number) {
    const now = Date.now();
    const res = await this.atomicClient.increment(this.lua, key, windowMs, limit);

    if (!Array.isArray(res) || res.length < 2) {
      throw new Error('Unexpected redis eval response');
    }

    const count = Number(res[0]);
    const ttl = Number(res[1]);

    if (!Number.isFinite(count) || count < 0) {
      throw new Error('Unexpected redis eval response');
    }
    if (!Number.isFinite(ttl) || ttl <= 0) {
      throw new Error('Unexpected redis eval response');
    }

    return { count, resetAt: now + ttl };
  }

  async get(key: string) {
    if (!this.rawClient) return undefined;
    const val = this.rawClient.get ? await this.rawClient.get(key) : null;
    if (val == null) return undefined;
    const count = Number(val);
    if (!Number.isFinite(count)) return undefined;
    let ttl = -1;
    if (typeof this.rawClient.pttl === 'function') {
      ttl = Number(await this.rawClient.pttl(key));
    }
    if (!Number.isFinite(ttl) || ttl < 0) ttl = 0;
    return { count, resetAt: Date.now() + ttl };
  }
}

// Try to initialize a shared store using existing dependencies if available
let sharedStore: RateLimitStore = new InMemoryStore();
let hasIoredis = false;
let IORedis: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const req: any = require;
  try { IORedis = req('ioredis'); hasIoredis = true; } catch (e) {}
} catch (e) {}

export function createSharedRateLimitStoreFromEnv(): RateLimitStore {
  if (process.env.NODE_ENV !== 'production') {
    return new InMemoryStore();
  }

  // Ambiguous configuration detection: if both legacy UPSTASH env and REDIS_URL are set,
  // this likely indicates a misconfigured environment. Reject to avoid silent provider
  // selection.
  if (process.env.REDIS_URL && process.env.UPSTASH_REDIS_REST_URL) {
    throw new Error('Ambiguous rate-limit store configuration: both REDIS_URL and UPSTASH_REDIS_REST_URL are set');
  }

  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) {
    throw new Error('Missing production shared store configuration (REDIS_URL)');
  }

  if (!hasIoredis || !IORedis) {
    throw new Error('Missing ioredis dependency for REDIS_URL-backed rate limiting');
  }

  const client = new IORedis(redisUrl);
  return new RedisStore(createAtomicRateLimitClient('ioredis', client), client);
}

if (process.env.NODE_ENV === 'production') {
  sharedStore = createSharedRateLimitStoreFromEnv();
}

// Export helper for tests to inject a store
export function setRateLimiterStore(s: RateLimitStore) {
  if (!isTestMode()) {
    throw new Error('setRateLimiterStore is only available in test mode');
  }
  sharedStore = s;
}

export const rateLimiter = async (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const tenantId = (req as AuthenticatedRequest).user?.tenantId;
  const key = tenantId
    ? `rl:tenant:${tenantId}:ip:${ip}`
    : `rl:ip:${ip}`;

  try {
    const counter = await sharedStore.incr(key, rateLimitWindowMs, maxRequestsPerWindow);
    if (
      !counter ||
      !Number.isFinite(counter.count) ||
      !Number.isFinite(counter.resetAt)
    ) {
      throw new Error('Malformed shared store response');
    }

    const remaining = Math.max(0, maxRequestsPerWindow - counter.count);
    res.setHeader('X-RateLimit-Limit', String(maxRequestsPerWindow));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(Math.ceil(counter.resetAt / 1000)));
    if (counter.count > maxRequestsPerWindow) {
      res.setHeader('Retry-After', String(Math.ceil((counter.resetAt - Date.now()) / 1000)));
      return res.status(429).json({ error: 'Too Many Requests' });
    }
    return next();
  } catch (err) {
    // Fail closed for security-sensitive middleware. Return a safe, non-leaking error body.
    const requestId = (typeof crypto !== 'undefined' && (crypto as any).randomUUID) ? (crypto as any).randomUUID() : String(Date.now()) + '-' + Math.floor(Math.random() * 1000000);
    console.error('[RateLimiter] Shared store error: (requestId=%s) %s', requestId, err?.message || err);
    return res.status(503).json({
      error: {
        code: 'RATE_LIMIT_STORE_UNAVAILABLE',
        message: 'This operation is temporarily unavailable.',
        requestId,
      }
    });
  }
};

// 2. Multi-Tenant Sync & Authentication Middleware
export const requireAuth = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) => {
  let token = '';
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split('Bearer ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid authorization token' });
  }

  try {
    let decodedToken: any;
    try {
      decodedToken = await adminAuth.verifyIdToken(token, true);
    } catch (err: any) {
      console.warn('[Security Auth Middleware] Token verification failed:', err?.message || err);
      return res.status(401).json({ 
        error: 'Unauthorized: Invalid or expired security token',
        message: err?.message || 'Token verification failed'
      });
    }

    const uid = decodedToken.uid;
    const email = decodedToken.email || `${uid}@user.local`;
    const emailVerified = !!decodedToken.email_verified;

    // Check email verification enforcement
    // Allow profile lookup and verification endpoints even if unverified so frontend can show verification status
    const isVerificationExemptPath = 
      req.path === '/api/user/me' || 
      req.path === '/api/auth/resend-verification' || 
      req.path === '/api/auth/verify-status';

    if (!emailVerified && !isVerificationExemptPath) {
      return res.status(403).json({
        error: 'Email verification required',
        code: 'EMAIL_NOT_VERIFIED',
        message: 'Your email address must be verified before accessing workspace resources.',
      });
    }

    // Determine default tenant ID based on email domain
    const domain = email.split('@')[1] || 'generic';
    const isPublicDomain = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'aol.com', 'icloud.com'].includes(domain.toLowerCase());
    const defaultTenantId = isPublicDomain ? `tenant-${uid}` : `tenant-${domain}`;

    // Perform database lookup for the user
    let dbUser = await db.select().from(users).where(eq(users.uid, uid)).then(rows => rows[0]);

    if (!dbUser) {
      // Look up by email to see if they were invited/pre-registered via an invitation flow
      dbUser = await db.select().from(users).where(eq(users.email, email)).then(rows => rows[0]);

      if (dbUser) {
        // User was invited with a pre-assigned role and tenantId
        const previousUid = dbUser.uid;
        const previousOnboarded = dbUser.onboarded;
        const updated = await db.update(users)
          .set({ uid, onboarded: 1 })
          .where(eq(users.id, dbUser.id))
          .returning();
        dbUser = updated[0];
        
        // Sync custom claims to Firebase Admin SDK for tenant isolation and RBAC
        const claimRes1 = await setUserCustomClaims(uid, {
          workspaceId: dbUser.tenantId,
          role: dbUser.role
        });
        if (!claimRes1.success) {
          await db.update(users)
            .set({ uid: previousUid, onboarded: previousOnboarded })
            .where(eq(users.id, dbUser.id));
          console.error(`[Multi-Tenant Auth Denied] Custom claims push failed for invited user ${email}: ${claimRes1.reason}`);
          return res.status(403).json({ error: `Forbidden: Security claim assignment failed (${claimRes1.reason})` });
        }
        console.log(`[Multi-Tenant Auth] Bound invited user: ${email} to Tenant: ${dbUser.tenantId} with Role: ${dbUser.role}`);
      } else {
        // Self-registered user: DEFAULT TO VIEWER ROLE ONLY. NO self-selected roles allowed!
        const inserted = await db.insert(users)
          .values({
            uid,
            email,
            tenantId: defaultTenantId,
            role: 'Viewer', // STRICT MANDATE: Default role for self-signup is Viewer only.
            onboarded: 0,
          })
          .onConflictDoUpdate({
            target: users.uid,
            set: { email },
          })
          .returning();
        dbUser = inserted[0];

        // Set custom claims on Firebase Admin
        const claimRes2 = await setUserCustomClaims(uid, {
          workspaceId: dbUser.tenantId,
          role: dbUser.role
        });
        if (!claimRes2.success) {
          await db.delete(users).where(eq(users.id, dbUser.id));
          console.error(`[Multi-Tenant Auth Denied] Custom claims push failed for new user ${email}: ${claimRes2.reason}`);
          return res.status(403).json({ error: `Forbidden: Security claim assignment failed (${claimRes2.reason})` });
        }
        console.log(`[Multi-Tenant Auth] Registered new user: ${email} with default Viewer role on Tenant: ${defaultTenantId}`);
      }
    } else {
      // Tenant and role claims are mandatory on every workspace request. Firebase
      // claim updates do not alter an already-issued ID token, so synchronize the
      // account but deny this request until the client obtains a fresh token.
      const claimRole = decodedToken.role;
      const claimWorkspace = decodedToken.workspaceId || decodedToken.tenantId;

      if (!claimRole || !claimWorkspace) {
        const claimResult = await setUserCustomClaims(uid, {
          workspaceId: dbUser.tenantId,
          role: dbUser.role
        });
        if (!claimResult.success) {
          console.error('[Multi-Tenant Auth Denied]', {
            uid,
            code: 'REQUIRED_CLAIMS_ASSIGNMENT_FAILED'
          });
          return res.status(403).json({
            error: 'Forbidden: Required tenant or role claim is missing',
            code: 'TOKEN_CLAIMS_MISSING'
          });
        }
        return res.status(403).json({
          error: 'Forbidden: Authentication claims were refreshed; obtain a new token',
          code: 'TOKEN_CLAIMS_REFRESH_REQUIRED'
        });
      }

      if (claimRole !== dbUser.role || claimWorkspace !== dbUser.tenantId) {
        const claimRes3 = await setUserCustomClaims(uid, {
          workspaceId: dbUser.tenantId,
          role: dbUser.role
        });
        if (!claimRes3.success) {
          console.error(`[Multi-Tenant Auth Denied] Custom claims sync failed for user ${email}: ${claimRes3.reason}`);
          return res.status(403).json({ error: `Forbidden: Security claim sync failed (${claimRes3.reason})` });
        }
        return res.status(403).json({
          error: 'Forbidden: Authentication claims changed; obtain a new token',
          code: 'TOKEN_CLAIMS_REFRESH_REQUIRED'
        });
      }
    }

    // Bind authenticated user metadata to request context
    req.user = {
      id: dbUser.id,
      uid: dbUser.uid,
      email: dbUser.email,
      tenantId: dbUser.tenantId,
      role: dbUser.role,
      emailVerified
    };

    next();
  } catch (error: any) {
    console.error('[Security Auth Middleware Error]:', error);
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired token' });
  }
};

// 3. Role-Based Access Control (RBAC) Verification Middleware
export const requireRole = (allowedRoles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required' });
    }

    const userRole = req.user.role;
    
    // Setup explicit hierarchy escalation
    const effectiveRoles = [...allowedRoles];
    if (allowedRoles.includes('Admin') && !effectiveRoles.includes('Owner')) {
      effectiveRoles.push('Owner');
    }
    if (allowedRoles.includes('Technician')) {
      effectiveRoles.push('Admin', 'Owner');
    }
    if (allowedRoles.includes('Viewer')) {
      effectiveRoles.push('Technician', 'Admin', 'Owner', 'Auditor');
    }
    if (allowedRoles.includes('Auditor')) {
      effectiveRoles.push('Admin', 'Owner');
    }

    if (!effectiveRoles.includes(userRole)) {
      return res.status(403).json({
        error: 'Forbidden: Insufficient privileges',
        message: `Your role (${userRole}) does not have permission to access this resource. Allowed roles: ${allowedRoles.join(', ')}`,
      });
    }

    next();
  };
};
