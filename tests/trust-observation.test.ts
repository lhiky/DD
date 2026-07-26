import { describe, expect, it } from 'vitest';
import { buildTrustObservation } from '../src/utils/trust-observation.ts';

const passport = {
  id: 'pass-1',
  name: 'SPR',
  version: '1.0.0',
  publisher: 'SPR',
  fileHash: '',
  sbom: [],
  timeline: [{ event: 'Passport Registered' }]
};

describe('evidence-first trust observation', () => {
  it('returns unknown rather than inventing scores when evidence is absent', () => {
    const result = buildTrustObservation({ passport, evidence: [], findings: [], observedAt: new Date('2026-01-01') });
    expect(result.vector.identity.score).toBeNull();
    expect(result.vector.security.state).toBe('unknown');
    expect(result.unknownLayer.unknownDimensions).toHaveLength(12);
    expect(result.findingSummary.note).toContain('not evidence that vulnerabilities are absent');
  });

  it('includes source, timestamp, method, confidence, and explanation for every observation', () => {
    const result = buildTrustObservation({
      passport,
      findings: [],
      observedAt: new Date('2026-01-02'),
      evidence: [{
        id: 'ev-1',
        name: 'Release signature',
        type: 'Signature',
        status: 'VERIFIED',
        source: 'sigstore.example',
        timestamp: '2026-01-01T00:00:00.000Z',
        verificationMethod: 'Signature and certificate chain verification'
      }]
    });
    const observation = result.vector.integrity.observations[0];
    expect(observation).toMatchObject({
      evidenceId: 'ev-1',
      source: 'sigstore.example',
      timestamp: '2026-01-01T00:00:00.000Z',
      verificationMethod: 'Signature and certificate chain verification',
      status: 'VERIFIED'
    });
    expect(observation.confidence).toBeGreaterThan(0);
    expect(result.vector.integrity.explanation).toContain('persisted observation');
  });

  it('reduces confidence as evidence ages', () => {
    const evidence = [{
      id: 'ev-1',
      name: 'Security scan',
      type: 'Security Scan',
      status: 'VERIFIED',
      source: 'scanner',
      timestamp: '2025-01-01T00:00:00.000Z',
      verificationMethod: 'Provider response verification'
    }];
    const recent = buildTrustObservation({ passport, evidence, findings: [], observedAt: new Date('2025-01-02') });
    const old = buildTrustObservation({ passport, evidence, findings: [], observedAt: new Date('2026-01-01') });
    expect(old.vector.security.confidence).toBeLessThan(recent.vector.security.confidence);
  });

  it('observes SBOM presence without claiming component authenticity', () => {
    const result = buildTrustObservation({
      passport: { ...passport, sbom: [{ name: 'express' }] },
      evidence: [],
      findings: [],
      observedAt: new Date('2026-01-01')
    });
    expect(result.vector.supplyChain.state).toBe('observed');
    expect(result.vector.supplyChain.observations[0].verificationMethod).toContain('not independently verified');
  });
});
