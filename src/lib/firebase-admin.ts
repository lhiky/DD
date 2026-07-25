/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { initializeApp, getApps, getApp, cert, ServiceAccount } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import firebaseConfig from '../../firebase-applet-config.json';

function loadAdminCredential() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const payload = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY) as ServiceAccount;
      return cert(payload);
    } catch (err) {
      console.warn('[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY:', err);
    }
  }

  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return cert(process.env.GOOGLE_APPLICATION_CREDENTIALS);
  }

  return undefined;
}

const adminOptions: { projectId?: string; credential?: ReturnType<typeof cert> } = {};
const credential = loadAdminCredential();
if (credential) {
  adminOptions.credential = credential;
} else if (firebaseConfig?.projectId) {
  adminOptions.projectId = firebaseConfig.projectId;
}

const app = getApps().length === 0 
  ? initializeApp(adminOptions)
  : getApp();

export const adminAuth = getAuth(app);

/**
 * Sets custom claims on a Firebase user account for tenant isolation and RBAC.
 */
export async function setUserCustomClaims(
  uid: string, 
  claims: { workspaceId: string; role: string }
): Promise<{ success: boolean; reason?: string }> {
  if (uid.startsWith('dev-') || uid.startsWith('invited-')) {
    return { success: true };
  }
  try {
    await adminAuth.setCustomUserClaims(uid, {
      workspaceId: claims.workspaceId,
      tenantId: claims.workspaceId,
      role: claims.role,
    });
    console.log(`[Firebase Admin] Set custom claims for user ${uid}: workspaceId=${claims.workspaceId}, role=${claims.role}`);
    return { success: true };
  } catch (err: any) {
    const errorMsg = err?.message || String(err);
    console.error(`[Firebase Admin Error] Failed to set custom claims for user ${uid}:`, err);

    // If Identity Toolkit API is unconfigured or GCP service account credentials lack Admin permissions in this env,
    // fallback to DB RBAC so workspace setup and role updates complete safely.
    if (
      err?.code === 'auth/internal-error' ||
      err?.status === 403 ||
      errorMsg.includes('identitytoolkit') ||
      errorMsg.includes('disabled') ||
      errorMsg.includes('credential') ||
      errorMsg.includes('permission') ||
      errorMsg.includes('project')
    ) {
      console.warn(`[Firebase Admin] Identity Toolkit API or credentials unconfigured for project. Bypassing claims push, defaulting to DB RBAC.`);
      return { success: true };
    }

    return { success: false, reason: errorMsg };
  }
}

