/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { AsyncLocalStorage } from 'node:async_hooks';
import * as schema from './schema.ts';

type Database = ReturnType<typeof drizzle<typeof schema>>;

function poolConfig(user?: string, password?: string, options?: string) {
  const sslMode = process.env.SQL_SSL?.trim().toLowerCase();
  return {
    host: process.env.SQL_HOST,
    user: user || process.env.SQL_USER,
    password: password || process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    ssl: sslMode === 'require' || sslMode === 'true'
      ? { rejectUnauthorized: true }
      : undefined,
    ...(options ? { options } : {}),
    connectionTimeoutMillis: 10000, // Fail fast if Postgres is down (10s limit)
    max: 20, // Max clients in pool (prevents connection starvation)
    idleTimeoutMillis: 30000, // Close idle clients after 30 seconds of inactivity
  };
}

export const createPool = () => new Pool(poolConfig());

const systemPool = createPool();

// Prevent unhandled pool-level errors from crashing the application
systemPool.on('error', (err) => {
  console.error('Unexpected error on idle SQL pool client:', err);
});

export const systemDb = drizzle(systemPool, { schema });

const tenantDatabaseContext = new AsyncLocalStorage<Database>();
const tenantDatabases = new Map<string, Database>();

function tenantDatabase(tenantId: string) {
  if (!/^[A-Za-z0-9._:@-]{1,200}$/.test(tenantId)) {
    throw new Error('TENANT_ID_INVALID');
  }
  const apiUser = process.env.SQL_API_USER;
  const apiPassword = process.env.SQL_API_PASSWORD;
  if (!apiUser || !apiPassword) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('TENANT_DATABASE_ROLE_MISSING');
    }
    return systemDb;
  }
  const existing = tenantDatabases.get(tenantId);
  if (existing) return existing;
  const pool = new Pool(poolConfig(
    apiUser,
    apiPassword,
    `-c app.current_tenant=${tenantId}`,
  ));
  pool.on('error', error => {
    console.error('Unexpected tenant SQL pool error:', {
      tenantId,
      code: (error as NodeJS.ErrnoException).code || 'TENANT_POOL_ERROR',
    });
  });
  const database = drizzle(pool, { schema });
  tenantDatabases.set(tenantId, database);
  return database;
}

export function runWithTenantDatabase<T>(tenantId: string, callback: () => T): T {
  return tenantDatabaseContext.run(tenantDatabase(tenantId), callback);
}

// Route code imports `db`; authenticated requests resolve it to their restricted
// tenant database. Bootstrap/background work resolves to the privileged system DB.
export const db: Database = new Proxy({} as Database, {
  get(_target, property) {
    const active = tenantDatabaseContext.getStore() || systemDb;
    const value = Reflect.get(active as object, property);
    return typeof value === 'function' ? value.bind(active) : value;
  },
});
