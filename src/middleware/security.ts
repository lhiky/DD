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

// 1. Simple, robust in-memory rate limiter to prevent API abuse
const rateLimitWindowMs = 60 * 1000; // 1 minute
const maxRequestsPerWindow = 100;    // max 100 requests per window
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || 'unknown';
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, {
      count: 1,
      resetTime: now + rateLimitWindowMs,
    });
    // Set standard rate limit headers
    res.setHeader('X-RateLimit-Limit', maxRequestsPerWindow);
    res.setHeader('X-RateLimit-Remaining', maxRequestsPerWindow - 1);
    return next();
  }

  if (record.count >= maxRequestsPerWindow) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Rate limit exceeded. Please try again in a minute.',
    });
  }

  record.count++;
  res.setHeader('X-RateLimit-Limit', maxRequestsPerWindow);
  res.setHeader('X-RateLimit-Remaining', Math.max(0, maxRequestsPerWindow - record.count));
  next();
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
      decodedToken = await adminAuth.verifyIdToken(token);
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
