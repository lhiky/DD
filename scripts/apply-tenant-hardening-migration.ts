import { readFile } from 'node:fs/promises';
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
    const sql = await readFile(
      new URL('../migrations/0004_require_explicit_tenant.sql', import.meta.url),
      'utf8',
    );
    await pool.query(sql);
    const verification = await pool.query<{
      remaining_defaults: number;
    }>(`
      SELECT count(*)::int AS remaining_defaults
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND column_name = 'tenant_id'
        AND column_default IS NOT NULL
    `);
    const remaining = verification.rows[0]?.remaining_defaults ?? -1;
    if (remaining !== 0) throw new Error('TENANT_DEFAULTS_REMAIN');
    console.log(JSON.stringify({
      event: 'tenant_hardening_migration_complete',
      remainingTenantDefaults: remaining,
    }));
  } finally {
    await pool.end();
  }
}

main().catch(error => {
  console.error(JSON.stringify({
    event: 'tenant_hardening_migration_failed',
    code: error instanceof Error ? error.message : 'UNKNOWN',
  }));
  process.exitCode = 1;
});
