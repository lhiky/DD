import crypto from 'node:crypto';
import os from 'node:os';
import { Pool, PoolClient } from 'pg';

type ClaimedJob = {
  id: string;
  tenant_id: string;
  passport_id: string;
  attempt_count: number;
  max_attempts: number;
};

type SbomComponent = {
  name?: string;
  version?: string;
  ecosystem?: string;
};

const WORKER_ID = `${os.hostname()}:${process.pid}`;
const PROVIDER_TIMEOUT_MS = 15_000;

export function createWorkerPool() {
  const sslMode = process.env.SQL_SSL?.trim().toLowerCase();
  return new Pool({
    host: process.env.SQL_HOST,
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DB_NAME,
    ssl: sslMode === 'require' || sslMode === 'true'
      ? { rejectUnauthorized: true }
      : undefined,
    max: 4,
    connectionTimeoutMillis: 10_000,
  });
}

async function claimJob(pool: Pool): Promise<ClaimedJob | null> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await client.query<ClaimedJob>(`
      SELECT id, tenant_id, passport_id, attempt_count, max_attempts
      FROM agent_jobs
      WHERE status = 'Pending'
        AND job_type = 'osv_manifest_scan'
        AND (next_attempt_at IS NULL OR next_attempt_at <= NOW())
      ORDER BY created_at
      FOR UPDATE SKIP LOCKED
      LIMIT 1
    `);
    const job = result.rows[0];
    if (!job) {
      await client.query('COMMIT');
      return null;
    }
    await client.query(`
      UPDATE agent_jobs
      SET status = 'Running',
          progress = 10,
          attempt_count = attempt_count + 1,
          locked_at = NOW(),
          locked_by = $2,
          updated_at = NOW()
      WHERE id = $1
    `, [job.id, WORKER_ID]);
    await client.query('COMMIT');
    return { ...job, attempt_count: job.attempt_count + 1 };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

async function fetchOsv(component: Required<Pick<SbomComponent, 'name' | 'version'>> & SbomComponent) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), PROVIDER_TIMEOUT_MS);
  try {
    const response = await fetch('https://api.osv.dev/v1/query', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        package: {
          name: component.name,
          ecosystem: component.ecosystem || 'npm',
        },
        version: component.version,
      }),
      signal: controller.signal,
    });
    const text = await response.text();
    if (!response.ok) {
      throw new Error(`OSV_HTTP_${response.status}`);
    }
    return { response: JSON.parse(text), raw: text };
  } finally {
    clearTimeout(timeout);
  }
}

async function persistProviderResult(
  client: PoolClient,
  job: ClaimedJob,
  component: Required<Pick<SbomComponent, 'name' | 'version'>> & SbomComponent,
  providerResponse: unknown,
  rawResponse: string,
) {
  const timestamp = new Date().toISOString();
  const evidenceId = `ev-osv-${crypto.randomUUID()}`;
  const digest = crypto.createHash('sha256').update(rawResponse).digest('hex');
  await client.query(`
    INSERT INTO evidence_items
      (id, tenant_id, asset_id, name, type, verified, signer, timestamp, hash,
       raw_content, engine_id, verification_failure_reason)
    VALUES ($1, $2, $3, $4, 'Security Scan', 0, 'api.osv.dev', $5, $6, $7,
            'osv-worker', NULL)
  `, [
    evidenceId,
    job.tenant_id,
    job.passport_id,
    `OSV response for ${component.name}@${component.version}`,
    timestamp,
    digest,
    JSON.stringify({
      source: 'https://api.osv.dev/v1/query',
      requestedComponent: component,
      receivedAt: timestamp,
      response: providerResponse,
    }),
  ]);

  const vulnerabilities = Array.isArray((providerResponse as any)?.vulns)
    ? (providerResponse as any).vulns
    : [];
  for (const vulnerability of vulnerabilities) {
    const aliases = Array.isArray(vulnerability.aliases) ? vulnerability.aliases : [];
    await client.query(`
      INSERT INTO scan_findings
        (id, tenant_id, asset_id, job_id, severity, category, title, description,
         component, status, detected_at, engine_id)
      VALUES ($1, $2, $3, $4, 'Unknown', 'Vulnerability', $5, $6, $7, 'Open', $8, 'osv-worker')
    `, [
      `finding-osv-${crypto.randomUUID()}`,
      job.tenant_id,
      job.passport_id,
      job.id,
      vulnerability.id || 'OSV vulnerability',
      vulnerability.summary || aliases.join(', ') || 'OSV returned a vulnerability record.',
      `${component.name}@${component.version}`,
      timestamp,
    ]);
  }
  return vulnerabilities.length;
}

async function processJob(pool: Pool, job: ClaimedJob) {
  const passportResult = await pool.query(
    'SELECT name, version, sbom FROM passports WHERE id = $1 AND tenant_id = $2',
    [job.passport_id, job.tenant_id],
  );
  const passport = passportResult.rows[0];
  if (!passport) throw new Error('PASSPORT_NOT_FOUND');

  let parsed: unknown;
  try {
    parsed = JSON.parse(passport.sbom || '[]');
  } catch {
    throw new Error('SBOM_MALFORMED');
  }
  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error('SBOM_EMPTY');
  }
  const components = (parsed as SbomComponent[]).filter(
    (component): component is Required<Pick<SbomComponent, 'name' | 'version'>> & SbomComponent =>
      typeof component?.name === 'string' && component.name.length > 0 &&
      typeof component?.version === 'string' && component.version.length > 0,
  );
  if (components.length === 0) throw new Error('SBOM_HAS_NO_VERSIONED_COMPONENTS');

  let findingCount = 0;
  for (const component of components) {
    const provider = await fetchOsv(component);
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      findingCount += await persistProviderResult(
        client,
        job,
        component,
        provider.response,
        provider.raw,
      );
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  const completedAt = new Date().toISOString();
  await pool.query(`
    INSERT INTO scans
      (id, tenant_id, target_name, scan_type, triggered_by, status, duration_ms,
       findings_count, timestamp, client_name)
    VALUES ($1, $2, $3, 'OSV manifest component query', $4, 'Completed', 0, $5, $6, $7)
  `, [
    `scan-osv-${crypto.randomUUID()}`,
    job.tenant_id,
    `${passport.name} ${passport.version}`,
    WORKER_ID,
    findingCount,
    completedAt,
    'Persisted passport SBOM',
  ]);
  await pool.query(`
    UPDATE agent_jobs
    SET status = 'Completed', progress = 100, result = $2, error = NULL,
        completed_at = NOW(), locked_at = NULL, locked_by = NULL, updated_at = NOW()
    WHERE id = $1
  `, [
    job.id,
    JSON.stringify({
      provider: 'OSV',
      evidenceState: 'Provider response persisted; not a cryptographic verification',
      componentsQueried: components.length,
      findingsPersisted: findingCount,
      completedAt,
    }),
  ]);
}

async function failJob(pool: Pool, job: ClaimedJob, error: unknown) {
  const code = error instanceof Error ? error.message : 'SCAN_WORKER_ERROR';
  const retry = job.attempt_count < job.max_attempts;
  await pool.query(`
    UPDATE agent_jobs
    SET status = $2,
        progress = CASE WHEN $2 = 'Failed' THEN 100 ELSE 0 END,
        error = $3,
        next_attempt_at = CASE WHEN $2 = 'Pending' THEN NOW() + INTERVAL '30 seconds' ELSE next_attempt_at END,
        locked_at = NULL,
        locked_by = NULL,
        completed_at = CASE WHEN $2 = 'Failed' THEN NOW() ELSE completed_at END,
        updated_at = NOW()
    WHERE id = $1
  `, [job.id, retry ? 'Pending' : 'Failed', code.slice(0, 200)]);
}

export async function runWorkerOnce(pool: Pool) {
  const job = await claimJob(pool);
  if (!job) return false;
  try {
    await processJob(pool, job);
  } catch (error) {
    await failJob(pool, job, error);
  }
  return true;
}

export async function runWorkerLoop() {
  const pool = createWorkerPool();
  let stopping = false;
  const stop = () => { stopping = true; };
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  console.log(JSON.stringify({ event: 'worker_started', workerId: WORKER_ID }));
  try {
    while (!stopping) {
      const processed = await runWorkerOnce(pool);
      if (!processed) await new Promise(resolve => setTimeout(resolve, 2_000));
    }
  } finally {
    await pool.end();
    console.log(JSON.stringify({ event: 'worker_stopped', workerId: WORKER_ID }));
  }
}
