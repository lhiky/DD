import os from 'node:os';
import crypto from 'node:crypto';
import type { Pool, PoolClient } from 'pg';
import { COLLECTORS, advanceSchedule, collectorJobKey, nextFailureState, observationWindow } from '../utils/monitoring.ts';

export const MONITORING_WORKER_ID = `${os.hostname()}:${process.pid}:monitoring`;
export const LEASE_SECONDS = 60;

export interface ClaimedCollectorJob {
  id: string;
  tenant_id: string;
  client_id: string;
  asset_id: string;
  passport_id: string;
  monitoring_configuration_id: string | null;
  collector_id: string;
  collector_version: string;
  subject_type: string;
  subject_identifier: string;
  attempt_number: number;
  maximum_attempts: number;
}

export async function scheduleDueConfigurations(client: PoolClient, now = new Date()) {
  await client.query('BEGIN');
  try {
    const due = await client.query(`
      SELECT *
      FROM monitoring_configurations
      WHERE enabled = 1 AND next_scheduled_at::timestamptz <= $1::timestamptz
      ORDER BY next_scheduled_at::timestamptz
      FOR UPDATE SKIP LOCKED
      LIMIT 100
    `, [now.toISOString()]);
    let created = 0;
    for (const configuration of due.rows) {
      const definition = COLLECTORS[configuration.collector_id];
      if (!definition) {
        await client.query(`
          UPDATE monitoring_configurations
          SET enabled = 0, last_status = 'unsupported', updated_at = $2
          WHERE id = $1 AND tenant_id = $3
        `, [configuration.id, now.toISOString(), configuration.tenant_id]);
        continue;
      }
      const window = observationWindow(now, configuration.schedule_seconds);
      const key = collectorJobKey({
        tenantId: configuration.tenant_id, assetId: configuration.asset_id,
        collectorId: configuration.collector_id, subjectIdentifier: configuration.subject_identifier,
        monitoredVersion: 'current', observationWindow: window, collectorVersion: definition.version,
      });
      const inserted = await client.query(`
        INSERT INTO collector_jobs (
          id, tenant_id, client_id, asset_id, passport_id, monitoring_configuration_id,
          collector_id, collector_version, subject_type, subject_identifier,
          schedule_source, observation_window, idempotency_key, state,
          attempt_number, maximum_attempts, created_at, next_attempt_at
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,'scheduler',$11,$12,'queued',0,$13,$14,$14)
        ON CONFLICT (idempotency_key) DO NOTHING
        RETURNING id
      `, [
        `collector-job-${crypto.randomUUID()}`, configuration.tenant_id, configuration.client_id,
        configuration.asset_id, configuration.passport_id, configuration.id,
        configuration.collector_id, definition.version, configuration.subject_type,
        configuration.subject_identifier, window, key, definition.maximumRetries, now.toISOString(),
      ]);
      created += inserted.rowCount || 0;
      const next = advanceSchedule(new Date(configuration.next_scheduled_at), now, configuration.schedule_seconds);
      await client.query(`
        UPDATE monitoring_configurations
        SET next_scheduled_at = $2, updated_at = $3
        WHERE id = $1 AND tenant_id = $4
      `, [configuration.id, next.toISOString(), now.toISOString(), configuration.tenant_id]);
    }
    await client.query('COMMIT');
    return { due: due.rowCount || 0, created };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  }
}

export async function claimCollectorJob(pool: Pool, workerId = MONITORING_WORKER_ID, now = new Date()) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const claimed = await client.query<ClaimedCollectorJob>(`
      WITH candidate AS (
        SELECT id
        FROM collector_jobs
        WHERE state IN ('queued','failed')
          AND next_attempt_at::timestamptz <= $1::timestamptz
          AND attempt_number < maximum_attempts
        ORDER BY created_at::timestamptz
        FOR UPDATE SKIP LOCKED
        LIMIT 1
      )
      UPDATE collector_jobs AS job
      SET state = 'claimed', lease_owner = $2,
          lease_expires_at = ($1::timestamptz + make_interval(secs => $3))::text,
          heartbeat_at = $1, started_at = COALESCE(started_at, $1),
          attempt_number = attempt_number + 1
      FROM candidate
      WHERE job.id = candidate.id
      RETURNING job.*
    `, [now.toISOString(), workerId, LEASE_SECONDS]);
    await client.query('COMMIT');
    return claimed.rows[0] || null;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

export async function heartbeatCollectorJob(
  pool: Pool, jobId: string, tenantId: string, workerId: string, now = new Date(),
) {
  const result = await pool.query(`
    UPDATE collector_jobs
    SET heartbeat_at = $3,
        lease_expires_at = ($3::timestamptz + make_interval(secs => $4))::text,
        state = 'running'
    WHERE id = $1 AND tenant_id = $5
      AND lease_owner = $2 AND state IN ('claimed','running')
    RETURNING id, lease_expires_at
  `, [jobId, workerId, now.toISOString(), LEASE_SECONDS, tenantId]);
  if (!result.rows[0]) throw new Error('JOB_LEASE_LOST');
  return result.rows[0];
}

export async function recoverExpiredLeases(pool: Pool, now = new Date()) {
  const result = await pool.query(`
    UPDATE collector_jobs
    SET state = CASE WHEN attempt_number >= maximum_attempts THEN 'dead_lettered' ELSE 'failed' END,
        safe_error_code = 'WORKER_LEASE_EXPIRED',
        safe_error_message = 'The collector worker stopped before producing a reliable observation.',
        lease_owner = NULL, lease_expires_at = NULL, heartbeat_at = NULL,
        next_attempt_at = $1,
        completed_at = CASE WHEN attempt_number >= maximum_attempts THEN $1 ELSE completed_at END
    WHERE state IN ('claimed','running')
      AND lease_expires_at::timestamptz < $1::timestamptz
    RETURNING id, state
  `, [now.toISOString()]);
  return result.rows;
}

export async function recordCollectorFailure(
  pool: Pool, job: ClaimedCollectorJob, workerId: string,
  code: string, message: string, timedOut = false, now = new Date(),
) {
  const finalState = nextFailureState(job.attempt_number, job.maximum_attempts);
  const state = finalState === 'dead_lettered' ? finalState : timedOut ? 'timed_out' : 'failed';
  const result = await pool.query(`
    UPDATE collector_jobs
    SET state = $4, safe_error_code = $5, safe_error_message = $6,
        lease_owner = NULL, lease_expires_at = NULL, heartbeat_at = NULL,
        completed_at = CASE WHEN $4 = 'dead_lettered' THEN $3 ELSE completed_at END,
        next_attempt_at = ($3::timestamptz + make_interval(secs => LEAST(3600, 30 * POWER(2, attempt_number))))::text
    WHERE id = $1 AND tenant_id = $7
      AND lease_owner = $2 AND state IN ('claimed','running')
    RETURNING id, state
  `, [job.id, workerId, now.toISOString(), state, code, message, job.tenant_id]);
  if (!result.rows[0]) throw new Error('JOB_LEASE_LOST');
  return result.rows[0];
}
