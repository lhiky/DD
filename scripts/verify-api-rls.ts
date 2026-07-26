import { Pool } from 'pg';

function config(user: string, password: string, options?: string) {
  const sslMode = process.env.SQL_SSL?.trim().toLowerCase();
  return {
    host: process.env.SQL_HOST,
    user,
    password,
    database: process.env.SQL_DB_NAME,
    ssl: sslMode === 'require' || sslMode === 'true'
      ? { rejectUnauthorized: true }
      : undefined,
    ...(options ? { options } : {}),
    max: 1,
    connectionTimeoutMillis: 10_000,
  };
}

async function main() {
  const system = new Pool(config(
    process.env.SQL_USER || '',
    process.env.SQL_PASSWORD || '',
  ));
  const apiUser = process.env.SQL_API_USER || '';
  const apiPassword = process.env.SQL_API_PASSWORD || '';
  try {
    const role = await system.query<{
      bypass: boolean;
    }>('SELECT rolbypassrls AS bypass FROM pg_roles WHERE rolname = $1', [apiUser]);
    if (!role.rows[0] || role.rows[0].bypass) throw new Error('API_ROLE_BYPASSES_RLS');
    const state = await system.query<{
      tenant_tables: number;
      enabled: number;
      forced: number;
    }>(`
      SELECT count(*)::int tenant_tables,
             count(*) FILTER (WHERE c.relrowsecurity)::int enabled,
             count(*) FILTER (WHERE c.relforcerowsecurity)::int forced
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN information_schema.columns col
        ON col.table_schema = n.nspname AND col.table_name = c.relname
      WHERE n.nspname = 'public' AND c.relkind = 'r'
        AND col.column_name = 'tenant_id'
    `);
    const counts = state.rows[0];
    if (
      counts.tenant_tables === 0 ||
      counts.enabled !== counts.tenant_tables ||
      counts.forced !== counts.tenant_tables
    ) {
      throw new Error('RLS_NOT_FORCED_ON_ALL_TENANT_TABLES');
    }
    const tenant = await system.query<{ tenant_id: string }>(`
      SELECT tenant_id FROM users
      WHERE tenant_id IS NOT NULL
      ORDER BY tenant_id
      LIMIT 1
    `);
    const tenantId = tenant.rows[0]?.tenant_id;
    if (!tenantId || !/^[A-Za-z0-9._:@-]{1,200}$/.test(tenantId)) {
      throw new Error('NO_VALID_TENANT_FOR_RLS_TEST');
    }
    const scoped = new Pool(config(
      apiUser,
      apiPassword,
      `-c app.current_tenant=${tenantId}`,
    ));
    const unscoped = new Pool(config(apiUser, apiPassword));
    try {
      const scopedResult = await scoped.query<{
        mismatches: number;
      }>('SELECT count(*)::int mismatches FROM users WHERE tenant_id <> $1', [tenantId]);
      if (scopedResult.rows[0].mismatches !== 0) {
        throw new Error('RLS_CROSS_TENANT_READ_VISIBLE');
      }
      const unscopedResult = await unscoped.query<{
        visible: number;
      }>('SELECT count(*)::int visible FROM users');
      if (unscopedResult.rows[0].visible !== 0) {
        throw new Error('RLS_UNSCOPED_READ_VISIBLE');
      }
    } finally {
      await scoped.end();
      await unscoped.end();
    }
    console.log(JSON.stringify({
      event: 'api_rls_verification_complete',
      tenantTables: counts.tenant_tables,
      enabled: counts.enabled,
      forced: counts.forced,
      crossTenantRowsVisible: 0,
      unscopedRowsVisible: 0,
    }));
  } finally {
    await system.end();
  }
}

main().catch(error => {
  console.error(JSON.stringify({
    event: 'api_rls_verification_failed',
    code: error instanceof Error ? error.message : 'UNKNOWN',
  }));
  process.exitCode = 1;
});
