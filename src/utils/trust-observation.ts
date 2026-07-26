export const TRUST_DIMENSIONS = [
  'identity',
  'integrity',
  'security',
  'reliability',
  'transparency',
  'compliance',
  'provenance',
  'privacy',
  'aiGovernance',
  'supplyChain',
  'resilience',
  'reputation'
] as const;

export type TrustDimension = typeof TRUST_DIMENSIONS[number];

export interface TrustEvidenceInput {
  id: string;
  name: string;
  type: string;
  status: string;
  source: string;
  timestamp: string;
  verificationMethod: string;
  failureReason?: string | null;
}

export interface TrustObservation {
  evidenceId: string;
  statement: string;
  source: string;
  timestamp: string;
  evidenceType: string;
  verificationMethod: string;
  status: string;
  confidence: number;
}

export interface TrustVectorEntry {
  dimension: TrustDimension;
  state: 'observed' | 'unknown';
  score: number | null;
  confidence: number;
  trend: 'stable' | 'unknown';
  explanation: string;
  observations: TrustObservation[];
  missingEvidence: string[];
}

export interface TrustObservationInput {
  passport: {
    id: string;
    name: string;
    version: string;
    publisher: string;
    fileHash?: string | null;
    sbom: unknown[];
    timeline: unknown[];
  };
  evidence: TrustEvidenceInput[];
  findings: Array<{ status: string; severity: string; detectedAt: string; engineId: string }>;
  observedAt?: Date;
}

const STATUS_SCORE: Record<string, number> = {
  VERIFIED: 100,
  PARTIALLY_VERIFIED: 75,
  OBSERVED: 60,
  CONFIGURED: 45,
  DECLARED: 30,
  STALE: 20,
  SOURCE_DISCONNECTED: 10,
  FAILED: 0
};

const STATUS_CONFIDENCE: Record<string, number> = {
  VERIFIED: 1,
  PARTIALLY_VERIFIED: 0.75,
  OBSERVED: 0.6,
  CONFIGURED: 0.45,
  DECLARED: 0.3,
  STALE: 0.2,
  SOURCE_DISCONNECTED: 0.1,
  FAILED: 0.9
};

function ageAdjustedConfidence(status: string, timestamp: string, observedAt: Date): number {
  const base = STATUS_CONFIDENCE[status] ?? 0;
  const recordedAt = new Date(timestamp).getTime();
  if (!Number.isFinite(recordedAt)) return 0;
  const ageDays = Math.max(0, (observedAt.getTime() - recordedAt) / 86_400_000);
  const decay = Math.pow(0.5, ageDays / 180);
  return Number((base * decay).toFixed(3));
}

function dimensionsForEvidence(type: string): TrustDimension[] {
  switch (type.toLowerCase()) {
    case 'signature': return ['identity', 'integrity', 'provenance'];
    case 'security scan': return ['security', 'supplyChain'];
    case 'build log': return ['integrity', 'provenance', 'transparency'];
    case 'audit report': return ['compliance'];
    case 'attestation': return ['identity', 'provenance'];
    default: return [];
  }
}

const REQUIRED_EVIDENCE: Record<TrustDimension, string[]> = {
  identity: ['Verified owner, publisher, or signing identity'],
  integrity: ['Verified artifact digest or digital signature'],
  security: ['Current security scan from an identified scanner'],
  reliability: ['Availability, incident, or reliability observations'],
  transparency: ['Observed source, build, or component disclosure'],
  compliance: ['Current control assessment or audit evidence'],
  provenance: ['Build provenance or signed attestation'],
  privacy: ['Privacy assessment or data-flow evidence'],
  aiGovernance: ['Model inventory, dataset declaration, and approval evidence'],
  supplyChain: ['Observed SBOM and dependency scan'],
  resilience: ['Recovery, failover, or resilience test evidence'],
  reputation: ['Longitudinal verified operational history']
};

export function buildTrustObservation(input: TrustObservationInput) {
  const observedAt = input.observedAt ?? new Date();
  const observations = new Map<TrustDimension, TrustObservation[]>(
    TRUST_DIMENSIONS.map(dimension => [dimension, []])
  );

  for (const item of input.evidence) {
    const confidence = ageAdjustedConfidence(item.status, item.timestamp, observedAt);
    const observation: TrustObservation = {
      evidenceId: item.id,
      statement: item.failureReason
        ? `${item.name}: verification failed (${item.failureReason})`
        : `${item.name}: ${item.status.toLowerCase().replaceAll('_', ' ')}`,
      source: item.source,
      timestamp: item.timestamp,
      evidenceType: item.type,
      verificationMethod: item.verificationMethod,
      status: item.status,
      confidence
    };
    for (const dimension of dimensionsForEvidence(item.type)) {
      observations.get(dimension)!.push(observation);
    }
  }

  if (input.passport.sbom.length > 0) {
    const timestamp = observedAt.toISOString();
    const sbomObservation: TrustObservation = {
      evidenceId: `passport:${input.passport.id}:sbom`,
      statement: `${input.passport.sbom.length} SBOM component records are stored`,
      source: `passport:${input.passport.id}`,
      timestamp,
      evidenceType: 'SBOM record',
      verificationMethod: 'Persisted document observation; component authenticity not independently verified',
      status: 'OBSERVED',
      confidence: 0.6
    };
    observations.get('transparency')!.push(sbomObservation);
    observations.get('supplyChain')!.push(sbomObservation);
  }

  const vector: Record<TrustDimension, TrustVectorEntry> = {} as Record<TrustDimension, TrustVectorEntry>;
  for (const dimension of TRUST_DIMENSIONS) {
    const items = observations.get(dimension)!;
    if (items.length === 0) {
      vector[dimension] = {
        dimension,
        state: 'unknown',
        score: null,
        confidence: 0,
        trend: 'unknown',
        explanation: `No qualifying ${dimension} evidence is available. Unknown does not mean unsafe.`,
        observations: [],
        missingEvidence: REQUIRED_EVIDENCE[dimension]
      };
      continue;
    }

    const weighted = items.reduce((sum, item) => sum + (STATUS_SCORE[item.status] ?? 0) * item.confidence, 0);
    const totalConfidence = items.reduce((sum, item) => sum + item.confidence, 0);
    vector[dimension] = {
      dimension,
      state: 'observed',
      score: totalConfidence > 0 ? Math.round(weighted / totalConfidence) : 0,
      confidence: Number((totalConfidence / items.length).toFixed(3)),
      trend: 'unknown',
      explanation: `Derived from ${items.length} persisted observation${items.length === 1 ? '' : 's'}; no unsupported evidence was inferred.`,
      observations: items,
      missingEvidence: []
    };
  }

  const unknownDimensions = TRUST_DIMENSIONS.filter(dimension => vector[dimension].state === 'unknown');
  return {
    schemaVersion: 'spr.trust-observation.v1',
    passport: {
      id: input.passport.id,
      name: input.passport.name,
      version: input.passport.version,
      publisher: input.passport.publisher
    },
    observedAt: observedAt.toISOString(),
    rule: 'SPR only says what it sees.',
    vector,
    unknownLayer: {
      knownDimensions: TRUST_DIMENSIONS.filter(dimension => vector[dimension].state === 'observed'),
      unknownDimensions,
      completeness: Number(((TRUST_DIMENSIONS.length - unknownDimensions.length) / TRUST_DIMENSIONS.length).toFixed(3))
    },
    history: input.passport.timeline,
    findingSummary: {
      observed: input.findings.length,
      open: input.findings.filter(finding => !['Resolved', 'Mitigated'].includes(finding.status)).length,
      note: input.findings.length === 0
        ? 'No findings are recorded. This is not evidence that vulnerabilities are absent.'
        : 'Finding counts describe persisted scanner output and are not a complete safety claim.'
    }
  };
}
