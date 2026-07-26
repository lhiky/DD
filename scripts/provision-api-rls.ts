import { Pool } from 'pg';

function identifier(value: string) {
  return `"${value.replaceAll('"', '""')}"`;
}

function literal(value: string) {
  return `'${value.replaceAll("'", "''")}'`;
}

async function main() {
  const role = process.env.SQL_API_USER?.trim();
  const password = process.env.SQL_API_PASSWORD;
  if (!role || !/^[a-z_][a-z0-9_]{0,62}$/.test(role)) {
    throw new Error('SQL_API_USER_INVALID');
  }
  if (!password || password.length < 32) {
    throw new Error('SQL_API_PASSWORD_INVALID');
  }
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
  const client = await pool.connect();
  try {
    const roleName = identifier(role);
    await client.query('BEGIN');
    await client.query(`
      DO $role$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = ${literal(role)}) THEN
          CREATE ROLE ${roleName} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE
            NOINHERIT NOREPLICATION NOBYPASSRLS PASSWORD ${literal(password)};
        ELSE
          ALTER ROLE ${roleName} LOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE
            NOINHERIT NOREPLICATION NOBYPASSRLS PASSWORD ${literal(password)};
        END IF;
      END
      $role$;
    `);
    await client.query(`GRANT CONNECT ON DATABASE ${identifier(process.env.SQL_DB_NAME || '')} TO ${roleName}`);
    await client.query(`GRANT USAGE ON SCHEMA public TO ${roleName}`);

    const tables = await client.query<{ table_name: string }>(`
      SELECT DISTINCT table_name
      FROM information_schema.columns
      WHERE table_schema = 'public' AND column_name = 'tenant_id'
      ORDER BY table_name
    `);
    for (const row of tables.rows) {
      const tableName = identifier(row.table_name);
      const policyName = identifier(`${row.table_name}_tenant_isolation`);
      await client.query(`GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.${tableName} TO ${roleName}`);
      await client.query(`ALTER TABLE public.${tableName} ENABLE ROW LEVEL SECURITY`);
      await client.query(`ALTER TABLE public.${tableName} FORCE ROW LEVEL SECURITY`);
      await client.query(`DROP POLICY IF EXISTS ${policyName} ON public.${tableName}`);
      await client.query(`
        CREATE POLICY ${policyName} ON public.${tableName}
        FOR ALL TO ${roleName}
        USING (
          tenant_id = NULLIF(current_setting('app.current_tenant', true), '')
        )
        WITH CHECK (
          tenant_id = NULLIF(current_setting('app.current_tenant', true), '')
        )
      `);
    }
    await client.query(`GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO ${roleName}`);
    await client.query('COMMIT');
    console.log(JSON.stringify({
      event: 'api_rls_provisioned',
      tenantTables: tables.rowCount,
      apiRoleBypassesRls: false,
    }));
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

main().catch(error => {
  console.error(JSON.stringify({
    event: 'api_rls_provision_failed',
    code: error instanceof Error ? error.message : 'UNKNOWN',
  }));
  process.exitCode = 1;
});
