import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();

describe('PostgreSQL tenant RLS architecture', () => {
  it('binds authenticated route execution to a tenant database context', () => {
    const middleware = readFileSync(
      path.join(root, 'src/middleware/security.ts'),
      'utf8',
    );
    expect(middleware).toContain('runWithTenantDatabase(dbUser.tenantId, next)');
  });

  it('uses a restricted API role and a fixed startup tenant setting', () => {
    const database = readFileSync(path.join(root, 'src/db/index.ts'), 'utf8');
    expect(database).toContain('process.env.SQL_API_USER');
    expect(database).toContain('process.env.SQL_API_PASSWORD');
    expect(database).toContain('`-c app.current_tenant=${tenantId}`');
    expect(database).toContain("throw new Error('TENANT_DATABASE_ROLE_MISSING')");
  });

  it('provisions forced policies and explicitly denies API-role bypass', () => {
    const provisioning = readFileSync(
      path.join(root, 'scripts/provision-api-rls.ts'),
      'utf8',
    );
    expect(provisioning).toContain('NOBYPASSRLS');
    expect(provisioning).toContain('ENABLE ROW LEVEL SECURITY');
    expect(provisioning).toContain('FORCE ROW LEVEL SECURITY');
    expect(provisioning).toContain("current_setting('app.current_tenant', true)");
  });
});
