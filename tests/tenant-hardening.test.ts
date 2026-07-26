import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();

describe('tenant isolation hardening', () => {
  it('does not define a shared fallback tenant in the database schema', () => {
    const schema = readFileSync(path.join(root, 'src/db/schema.ts'), 'utf8');
    expect(schema).not.toContain(".default('tenant-default')");
  });

  it('drops legacy tenant defaults in the production migration', () => {
    const migration = readFileSync(
      path.join(root, 'migrations/0004_require_explicit_tenant.sql'),
      'utf8',
    );
    expect(migration).toContain('ALTER COLUMN tenant_id DROP DEFAULT');
    expect(migration).not.toContain('ENABLE ROW LEVEL SECURITY');
  });

  it('scopes repository worker mutations and reads to the claimed tenant', () => {
    const worker = readFileSync(path.join(root, 'src/workers/osv-worker.ts'), 'utf8');
    expect(worker).toContain('WHERE job_id = $1 AND tenant_id = $16');
    expect(worker).toContain(
      'FROM scan_findings WHERE job_id = $1 AND tenant_id = $2 ORDER BY id',
    );
    expect(worker).toContain('WHERE passports.tenant_id = EXCLUDED.tenant_id');
    expect(worker).toContain('WHERE id = $1 AND tenant_id = $4');
  });

  it('creates and verifies MFA secrets only on the server', () => {
    const server = readFileSync(path.join(root, 'server.ts'), 'utf8');
    const onboarding = readFileSync(
      path.join(root, 'src/components/OnboardingWizard.tsx'),
      'utf8',
    );
    expect(server).toContain("crypto.randomBytes(20)");
    expect(server).toContain("'/api/organization/security/enroll-mfa'");
    expect(server).toContain('secretToVerify = decryptMfaSecret(dbUser.mfaSecret)');
    expect(server).toContain('mfaSecret: encryptMfaSecret(secret)');
    expect(onboarding).not.toContain('crypto.getRandomValues');
    expect(onboarding).not.toContain('generateTOTPCode');
    expect(onboarding).toContain("'/api/organization/security/enroll-mfa'");
  });
});
