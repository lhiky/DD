import fs from 'node:fs/promises';
import { Client } from 'pg';

const client = new Client({
  host: process.env.SQL_HOST,
  user: process.env.SQL_USER,
  password: process.env.SQL_PASSWORD,
  database: process.env.SQL_DB_NAME,
  ssl: process.env.SQL_SSL === 'require' || process.env.SQL_SSL === 'true'
    ? { rejectUnauthorized: true }
    : undefined
});

try {
  await client.connect();
  await client.query(await fs.readFile('migrations/0005_tenant_branding.sql', 'utf8'));
  const result = await client.query(
    `select relrowsecurity, relforcerowsecurity from pg_class where relname = 'tenant_branding'`
  );
  console.log(JSON.stringify(result.rows));
} finally {
  await client.end();
}
