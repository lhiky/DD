import { Pool } from 'pg';
import {
  encryptMfaSecret,
  isEncryptedMfaSecret,
} from '../src/utils/mfa-secret.ts';

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
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query<{
      id: number;
      mfa_secret: string;
    }>(`
      SELECT id, mfa_secret
      FROM users
      WHERE mfa_secret IS NOT NULL AND mfa_secret <> ''
      FOR UPDATE
    `);
    let migrated = 0;
    for (const row of result.rows) {
      if (isEncryptedMfaSecret(row.mfa_secret)) continue;
      await client.query(
        'UPDATE users SET mfa_secret = $2 WHERE id = $1 AND mfa_secret = $3',
        [row.id, encryptMfaSecret(row.mfa_secret), row.mfa_secret],
      );
      migrated++;
    }
    await client.query('COMMIT');
    console.log(JSON.stringify({
      event: 'mfa_secret_migration_complete',
      configured: result.rowCount,
      migrated,
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
    event: 'mfa_secret_migration_failed',
    code: error instanceof Error ? error.message : 'UNKNOWN',
  }));
  process.exitCode = 1;
});
