import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  canonicalize, observationHash, compareObservationPayloads, changeDeduplicationKey
} from '../src/utils/observation-history.ts';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');

describe('immutable observation history', () => {
  it('canonicalizes object keys and changes the hash only when canonical content changes', () => {
    expect(canonicalize({ b: 2, a: 1 })).toBe(canonicalize({ a: 1, b: 2 }));
    expect(observationHash({ b: 2, a: 1 })).toBe(observationHash({ a: 1, b: 2 }));
    expect(observationHash({ a: 1 })).not.toBe(observationHash({ a: 2 }));
  });

  it('detects state, score eligibility, confidence, completeness, finding, and collector changes', () => {
    const previous = {
      vector: { security: { state: 'unknown', score: null, confidence: null, collectorStatuses: [] } },
      unknownLayer: { completeness: 0 },
      findings: []
    };
    const current = {
      vector: { security: { state: 'partially_known', score: null, confidence: 0.7, collectorStatuses: [{ state: 'failed' }] } },
      unknownLayer: { completeness: 0.1 },
      findings: [{ id: 'finding-1', status: 'Open' }]
    };
    expect(compareObservationPayloads(previous, current).map(item => item.type)).toEqual(expect.arrayContaining([
      'dimension_became_known', 'collector_failed', 'completeness_increased', 'finding_created'
    ]));
  });

  it('creates deterministic alert deduplication keys for unchanged conditions', () => {
    const change = { type: 'dimension_became_unknown' as const, subject: 'security', before: 'known', after: 'unknown' };
    expect(changeDeduplicationKey('passport-1', change)).toBe(changeDeduplicationKey('passport-1', change));
    expect(changeDeduplicationKey('passport-1', change)).not.toBe(changeDeduplicationKey('passport-2', change));
  });

  it('locks persisted snapshots against update and delete in the database migration', () => {
    const migration = readFileSync(path.join(root, 'migrations/0001_immutable_trust_observations.sql'), 'utf8');
    expect(migration).toContain('BEFORE UPDATE OR DELETE ON trust_observations');
    expect(migration).toContain("RAISE EXCEPTION 'TRUST_OBSERVATION_IMMUTABLE'");
    expect(migration).toContain('UNIQUE (tenant_id, passport_id, observation_version)');
  });

  it('tenant-scopes every observation and alert identifier lookup', () => {
    const server = readFileSync(path.join(root, 'server.ts'), 'utf8');
    expect(server).toContain('eq(trustObservationsTable.tenantId, req.user!.tenantId)');
    expect(server).toContain('eq(alertsTable.tenantId, req.user!.tenantId)');
    expect(server).toContain("if (!row) return res.status(404).json({ error: 'Trust observation not found' })");
    expect(server).toContain("if (!row) return res.status(404).json({ error: 'Alert not found' })");
  });
});
