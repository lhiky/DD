import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = (file: string) => readFileSync(path.join(root, file), 'utf8');

describe('production truth regressions', () => {
  it('does not inject hardcoded infrastructure assets when no assets are supplied', () => {
    const source = read('src/components/AssetsView.tsx');
    expect(source).toMatch(/const systemAssets = assets \?\? \[\]/);
    expect(source).not.toMatch(/db-prod-primary\.node\.internal/);
  });

  it('does not publish invented extension signature values', () => {
    const source = read('src/data/extensionsData.ts');
    expect(source).not.toMatch(/SHA-256 Verified:/);
    expect(source).toMatch(/Not verified — no signature evidence provided/);
  });

  it('does not execute timer-driven TrustOS advisory responses', () => {
    const source = read('src/components/TrustOSView.tsx');
    const handler = source.slice(
      source.indexOf('const handleAskAdvisor'),
      source.indexOf('// 4. Future Marketplace States')
    );
    expect(handler).toMatch(/apiFetch\('\/api\/ai\/advisor'/);
    expect(handler).toMatch(/finally[\s\S]*setIsAdvisorLoading\(false\)[\s\S]*return;/);
  });

  it('does not label local self-passport evidence as verified', () => {
    const source = read('server.ts');
    const selfPassport = source.slice(
      source.indexOf('const buildSelfPassport'),
      source.indexOf('const ensureSelfPassport')
    );
    expect(selfPassport).not.toMatch(/status:\s*'VERIFIED'/);
    expect(selfPassport).toMatch(/status:\s*'OBSERVED'/);
    expect(selfPassport).toMatch(/isPublisherVerified:\s*false/);
  });

  it('does not expose canned compliance timeline events', () => {
    const source = read('src/components/ComplianceView.tsx');
    expect(source).toMatch(/const filteredEvents = \(\[\] as AuditTimelineEvent\[\]\)/);
    expect(source).toMatch(/status:\s*'Not verified', evidence:\s*'Awaiting evidence'/);
  });

  it('does not convert failed persistence into local success records', () => {
    const source = read('src/App.tsx');
    expect(source).not.toMatch(/Local log appended/);
    expect(source).not.toMatch(/Local batch tag fallback applied/);
    expect(source).not.toMatch(/health:\s*'Compliant'/);
  });

  it('starts newly registered subjects without unsupported trust scores', () => {
    const source = read('server.ts');
    expect(source).toMatch(/trustScore:\s*0,\s*\r?\n\s*riskLevel:\s*'Unknown'/);
    expect(source).toMatch(/const isPublisherVerified = false/);
    expect(source).toMatch(/const complianceScore = Math\.min\(100, verifiedEvidence \* 20\)/);
  });

  it('renders the enterprise capability catalog as unverified until evidence is connected', () => {
    const source = read('src/components/EnterpriseReadinessView.tsx');
    expect(source).toMatch(/return capabilityCatalog\.map\(item =>/);
    expect(source).toMatch(/status:\s*'Unverified'/);
    expect(source).toMatch(/Implementation and operational evidence have not been independently verified/);
    expect(source).toMatch(/No verification evidence is connected/);
  });

  it('keeps onboarding copy clear and avoids unsupported security claims', () => {
    const wizard = read('src/components/OnboardingWizard.tsx');
    const tutorial = read('src/components/TrustOSTutorial.tsx');
    const checklist = read('src/components/PilotOnboardingChecklist.tsx');

    expect(wizard).toContain('Set up your SPR workspace');
    expect(wizard).toContain('Four short steps');
    expect(wizard).not.toContain('Generating Node Isolation');
    expect(wizard).not.toContain('Secret Handshake Key');
    expect(tutorial).toContain('This four-step tour shows the basic workflow');
    expect(tutorial).not.toContain('crown jewel');
    expect(tutorial).not.toContain('immutable ledger');
    expect(checklist).not.toContain('sealed cryptographic channel');
    expect(checklist).not.toContain('absolute pilot-readiness');
  });
});

describe('independent OSV worker truth boundaries', () => {
  it('claims persisted jobs with database locking and stores provider evidence as observed', () => {
    const worker = read('src/workers/osv-worker.ts');
    expect(worker).toContain('FOR UPDATE SKIP LOCKED');
    expect(worker).toContain("https://api.osv.dev/v1/query");
    expect(worker).toContain("'Security Scan', 0, 'api.osv.dev'");
    expect(worker).toContain("evidenceState: 'Provider response persisted; not a cryptographic verification'");
  });

  it('does not dispatch the supported OSV job inside the HTTP process', () => {
    const server = read('server.ts');
    expect(server).toContain('OSV manifest scan job persisted and awaiting an independent worker.');
    expect(server).not.toContain('processAgentJobInBackground(jobId');
  });
});
