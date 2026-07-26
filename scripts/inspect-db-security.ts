import { Pool } from 'pg';

async function main() {
  const sslMode = process.env.SQL_SSL?.trim().toLowerCase();
  const pool = new Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    ssl: sslMode === 'require' || sslMode === 'true'
      ? { rejectUnauthorized: true }
      : undefined,
    max: 1,
    connectionTimeoutMillis: 10_000,
  });
  try {
    const capability = await pool.query<{
      rol_super: boolean;
      can_create_role: boolean;
      bypass_rls: boolean;
    }>(`
      SELECT rolsuper AS rol_super, rolcreaterole AS can_create_role,
             rolbypassrls AS bypass_rls
      FROM pg_roles
      WHERE rolname = current_user
    `);
    const tables = await pool.query<{
      tenant_tables: number;
      rls_enabled: number;
      rls_forced: number;
    }>(`
      SELECT
        count(*)::int AS tenant_tables,
        count(*) FILTER (WHERE c.relrowsecurity)::int AS rls_enabled,
        count(*) FILTER (WHERE c.relforcerowsecurity)::int AS rls_forced
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      JOIN information_schema.columns col
        ON col.table_schema = n.nspname AND col.table_name = c.relname
      WHERE n.nspname = 'public'
        AND c.relkind = 'r'
        AND col.column_name = 'tenant_id'
    `);
    console.log(JSON.stringify({
      event: 'database_security_capability',
      role: capability.rows[0],
      tables: tables.rows[0],
    }));
  } finally {
    await pool.end();
  }
}

main().catch(error => {
  console.error(JSON.stringify({
    event: 'database_security_capability_failed',
    code: error instanceof Error ? error.message : 'UNKNOWN',
  }));
  process.exitCode = 1;
});
