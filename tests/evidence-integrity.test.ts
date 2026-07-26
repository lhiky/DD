import crypto from 'node:crypto';
import { describe, expect, it } from 'vitest';
import {
  MAX_EVIDENCE_VERIFICATION_BYTES,
  verifyEvidenceIntegrity
} from '../src/utils/evidence-integrity.ts';

describe('evidence payload integrity verification', () => {
  it('verifies the exact persisted bytes against SHA-256', () => {
    const raw = '{"provider":"osv","result":"observed"}';
    const hash = crypto.createHash('sha256').update(raw).digest('hex');
    expect(verifyEvidenceIntegrity(raw, `sha256:${hash}`)).toMatchObject({
      outcome: 'verified',
      verified: true,
      storedHash: hash,
      computedHash: hash,
      failureReason: null
    });
  });

  it('fails without claiming semantic verification when bytes differ', () => {
    const expected = crypto.createHash('sha256').update('original').digest('hex');
    expect(verifyEvidenceIntegrity('changed', expected)).toMatchObject({
      outcome: 'failed',
      verified: false,
      failureReason: 'SHA256_MISMATCH'
    });
  });

  it('rejects invalid digests and oversized payloads', () => {
    expect(verifyEvidenceIntegrity('value', 'not-a-hash').failureReason).toBe('INVALID_STORED_SHA256');
    expect(verifyEvidenceIntegrity('x'.repeat(MAX_EVIDENCE_VERIFICATION_BYTES + 1), '0'.repeat(64)))
      .toMatchObject({ outcome: 'rejected', failureReason: 'EVIDENCE_PAYLOAD_TOO_LARGE' });
  });
});
