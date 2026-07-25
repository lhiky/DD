/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Brain,
  Shield,
  ShieldAlert,
  CheckCircle2,
  Cpu,
  Zap,
  Play,
  RefreshCw,
  Sliders,
  Database,
  Activity,
  FileText,
  Layers,
  Lock,
  GitBranch,
  BookOpen,
  ChevronRight,
  TrendingUp,
  AlertTriangle,
  Flame,
  Award,
  Terminal,
  HelpCircle,
  Clock,
  ArrowRight,
  Sparkles,
  Globe,
  Users,
  Scale,
  Server,
  Eye,
  Network,
  Fingerprint,
  Code
} from 'lucide-react';

interface RuleDefinition {
  id: string;
  name: string;
  description: string;
  category: string; // Maps to trust domains (e.g., security, identity, source, etc.)
  status: 'Defined'; // Framework definition only — not tied to a live enforcement engine yet
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  auditProof: string; // Reference note only — never a real cryptographic value; see rendering
  liveAssertions: string[]; // Requirement descriptions for this rule, not live runtime events
}

interface TrustMetric {
  id: string;
  name: string;
  description: string;
  status: 'Unverified' | 'Calibrating' | 'Pending' | 'Warning';
  score: number;
  weight: number; // For admin interactive slider (0 - 100)
  evidence: string;
}

interface TrustDomain {
  id: string;
  name: string;
  emoji: string;
  overallScore: number;
  description: string;
  metrics: TrustMetric[];
}

interface TrustBrainViewProps {
  userRole?: string;
}

export default function TrustBrainView({ userRole }: TrustBrainViewProps) {
  const [activeCategory, setActiveCategory] = useState<string>('security');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedRule, setSelectedRule] = useState<RuleDefinition | null>(null);
  
  // Multi-Role RBAC State: Secure default (false). Only true if role is verified Admin or Owner.
  const [isAdmin, setIsAdmin] = useState<boolean>(
    userRole === 'Admin' || userRole === 'Owner'
  );

  // Self-Evolving Architecture Sandbox Active Module state
  const [activeArchModule, setActiveArchModule] = useState<string>('learning');

  // The role is supplied by App after server profile verification.
  useEffect(() => {
    setIsAdmin(userRole === 'Admin' || userRole === 'Owner');
  }, [userRole]);

  // 17 Trust Domains mapping perfectly to the user's requested layout
  const [domains, setDomains] = useState<TrustDomain[]>([
    {
      id: 'security',
      name: 'Security Trust',
      emoji: '🛡️',
      overallScore: 96,
      description: 'Dynamic security evaluations measuring vulnerabilities, zero-day exposure, SAST quality, and network barriers.',
      metrics: [
        { id: 'vulnerability-score', name: 'Vulnerability score', description: 'Aggregated CVSS score analysis and critical vulnerability density.', status: 'Unverified', score: 98, weight: 80, evidence: 'Not yet connected to a live evidence source' },
        { id: 'zero-day', name: 'Zero-day exposure', description: 'Heuristic evaluation and threat feed analysis of zero-day exploits.', status: 'Unverified', score: 95, weight: 90, evidence: 'Not yet connected to a live evidence source' },
        { id: 'malware', name: 'Malware detection', description: 'Static signature checks and sandboxed binary analysis profiles.', status: 'Unverified', score: 100, weight: 100, evidence: 'Not yet connected to a live evidence source' },
        { id: 'ransomware', name: 'Ransomware resilience', description: 'Immutable file backups and process behavioral monitoring.', status: 'Calibrating', score: 92, weight: 70, evidence: 'Not yet connected to a live evidence source' },
        { id: 'secure-coding', name: 'Secure coding', description: 'Static analysis (SAST) warnings density and linting compliance.', status: 'Unverified', score: 94, weight: 60, evidence: 'Not yet connected to a live evidence source' },
        { id: 'encryption', name: 'Encryption quality', description: 'Cipher suite compliance audit (prohibiting deprecated algorithms).', status: 'Unverified', score: 100, weight: 80, evidence: 'Not yet connected to a live evidence source' },
        { id: 'secrets', name: 'Secrets exposure', description: 'Scanning of source files for committed keys, tokens, or credentials.', status: 'Unverified', score: 100, weight: 95, evidence: 'Not yet connected to a live evidence source' },
        { id: 'patch-quality', name: 'Patch quality', description: 'Averages of time-to-patch and dependency update frequencies.', status: 'Unverified', score: 88, weight: 50, evidence: 'Not yet connected to a live evidence source' },
        { id: 'auth', name: 'Authentication', description: 'Multi-factor authentication coverage and identity provider trust.', status: 'Unverified', score: 98, weight: 85, evidence: 'Not yet connected to a live evidence source' },
        { id: 'authz', name: 'Authorization', description: 'Enforcement of row-level multi-tenant and role-based RBAC.', status: 'Unverified', score: 100, weight: 95, evidence: 'Not yet connected to a live evidence source' },
        { id: 'mfa', name: 'MFA readiness', description: 'Coverage of physical security keys (YubiKey) across active accounts.', status: 'Unverified', score: 95, weight: 75, evidence: 'Not yet connected to a live evidence source' },
        { id: 'session', name: 'Session security', description: 'Lifespans, cryptographic token signatures, and blacklisting speeds.', status: 'Unverified', score: 97, weight: 70, evidence: 'Not yet connected to a live evidence source' },
        { id: 'api-security', name: 'API security', description: 'Rate limit policies, input validation filters, and route scopes.', status: 'Unverified', score: 94, weight: 80, evidence: 'Not yet connected to a live evidence source' },
        { id: 'network-security', name: 'Network security', description: 'Server-side isolation, virtual firewalls, and reverse proxies.', status: 'Unverified', score: 99, weight: 85, evidence: 'Not yet connected to a live evidence source' }
      ]
    },
    {
      id: 'identity',
      name: 'Identity Trust',
      emoji: '🪪',
      overallScore: 98,
      description: 'Continuous cryptographic binding of software binaries, containers, devices, and human committers.',
      metrics: [
        { id: 'sw-id', name: 'Software identity', description: 'Unique cryptographic identifier of SBOM and compiled packages.', status: 'Unverified', score: 100, weight: 100, evidence: 'Not yet connected to a live evidence source' },
        { id: 'vendor-id', name: 'Vendor identity', description: 'Mutual TLS validation of publishing vendor servers and profiles.', status: 'Unverified', score: 98, weight: 90, evidence: 'Not yet connected to a live evidence source' },
        { id: 'developer-id', name: 'Developer identity', description: 'Commit-author validation mapped to verified cryptographic keys.', status: 'Unverified', score: 95, weight: 85, evidence: 'Not yet connected to a live evidence source' },
        { id: 'org-id', name: 'Organization identity', description: 'Business registry verification and secure tenant setup mappings.', status: 'Unverified', score: 100, weight: 80, evidence: 'Not yet connected to a live evidence source' },
        { id: 'repo-id', name: 'Repository identity', description: 'Verifiable Github context or public VCS host integrity.', status: 'Unverified', score: 99, weight: 75, evidence: 'Not yet connected to a live evidence source' },
        { id: 'package-id', name: 'Package identity', description: 'Manifest name binding checks in standard NPM/Docker registries.', status: 'Unverified', score: 98, weight: 70, evidence: 'Not yet connected to a live evidence source' },
        { id: 'container-id', name: 'Container identity', description: 'Docker layer checks and digital signing via Cosign.', status: 'Unverified', score: 100, weight: 90, evidence: 'Not yet connected to a live evidence source' },
        { id: 'binary-id', name: 'Binary identity', description: 'Code-signing certificates for server-side executables.', status: 'Unverified', score: 96, weight: 85, evidence: 'Not yet connected to a live evidence source' },
        { id: 'api-id', name: 'API identity', description: 'API registration and signed endpoint handshakes.', status: 'Unverified', score: 95, weight: 80, evidence: 'Not yet connected to a live evidence source' },
        { id: 'device-id', name: 'Device identity', description: 'TPM/HSM hardware credentials used for final binary wrapping.', status: 'Calibrating', score: 90, weight: 65, evidence: 'Not yet connected to a live evidence source' },
        { id: 'dig-sig', name: 'Digital signatures', description: 'Strength of keys used for commit co-signing.', status: 'Unverified', score: 100, weight: 90, evidence: 'Not yet connected to a live evidence source' },
        { id: 'cert-trust', name: 'Certificate trust', description: 'Hour-by-hour checking of certificate revocation list (CRL).', status: 'Unverified', score: 99, weight: 75, evidence: 'Not yet connected to a live evidence source' },
        { id: 'domain-own', name: 'Domain ownership', description: 'DNSSEC compliance and validation of MX/TXT records.', status: 'Unverified', score: 97, weight: 70, evidence: 'Not yet connected to a live evidence source' },
        { id: 'brand-verify', name: 'Brand verification', description: 'Co-signed certificate matching domain and visual identity logos.', status: 'Unverified', score: 94, weight: 50, evidence: 'Not yet connected to a live evidence source' }
      ]
    },
    {
      id: 'source',
      name: 'Source Trust',
      emoji: '💻',
      overallScore: 94,
      description: 'Audit tracking of open-source provenance, commit history, contributor authenticity, and hermetic reproducibility.',
      metrics: [
        { id: 'code-origin', name: 'Code origin', description: 'Lineage back to the original source control repositories.', status: 'Unverified', score: 98, weight: 85, evidence: 'Not yet connected to a live evidence source' },
        { id: 'commit-hist', name: 'Commit history', description: 'Absence of force-pushes or modified history trees on master branch.', status: 'Unverified', score: 100, weight: 80, evidence: 'Not yet connected to a live evidence source' },
        { id: 'contrib-verify', name: 'Contributor verification', description: 'Percentage of commits signed by validated developers.', status: 'Unverified', score: 91, weight: 90, evidence: 'Not yet connected to a live evidence source' },
        { id: 'code-own', name: 'Code ownership', description: 'Explicit code reviewer assignments (CODEOWNERS enforcement).', status: 'Unverified', score: 95, weight: 60, evidence: 'Not yet connected to a live evidence source' },
        { id: 'repo-health', name: 'Repository health', description: 'Pruning rate of dead branches and speed of issue resolution.', status: 'Unverified', score: 85, weight: 40, evidence: 'Not yet connected to a live evidence source' },
        { id: 'fork-hist', name: 'Fork history', description: 'Validations that upstream security patches have been pulled.', status: 'Unverified', score: 90, weight: 55, evidence: 'Not yet connected to a live evidence source' },
        { id: 'os-lineage', name: 'Open-source lineage', description: 'Detailed licenses breakdown and copyleft compliance logs.', status: 'Unverified', score: 96, weight: 70, evidence: 'Not yet connected to a live evidence source' },
        { id: 'bin-prov', name: 'Binary provenance', description: 'Attestations connecting the compiled output back to source.', status: 'Unverified', score: 98, weight: 95, evidence: 'Not yet connected to a live evidence source' },
        { id: 'build-prov', name: 'Build provenance', description: 'Identified runner host environment and hermetic boundaries.', status: 'Unverified', score: 99, weight: 90, evidence: 'Not yet connected to a live evidence source' },
        { id: 'artifact-verify', name: 'Artifact verification', description: 'Dynamic checking of target libraries before package insertion.', status: 'Unverified', score: 100, weight: 85, evidence: 'Not yet connected to a live evidence source' },
        { id: 'reproducible', name: 'Reproducible builds', description: 'Bit-for-bit identical hashes from independent builds.', status: 'Calibrating', score: 82, weight: 75, evidence: 'Not yet connected to a live evidence source' }
      ]
    },
    {
      id: 'supply_chain',
      name: 'Supply Chain Trust',
      emoji: '📦',
      overallScore: 97,
      description: 'Audit tracking of package scorecards, library health indices, NTIA-compliant SBOM layers, and pipeline runners.',
      metrics: [
        { id: 'dep-trust', name: 'Dependency trust', description: 'Calculated transitive risk scores of deep package dependencies.', status: 'Unverified', score: 96, weight: 85, evidence: 'Not yet connected to a live evidence source' },
        { id: 'pkg-trust', name: 'Package trust', description: 'Rejection of typo-squatting packages or unrated releases.', status: 'Unverified', score: 99, weight: 90, evidence: 'Not yet connected to a live evidence source' },
        { id: 'lib-health', name: 'Library health', description: 'Abandonware flags, deprecation frequency, and update rates.', status: 'Unverified', score: 89, weight: 65, evidence: 'Not yet connected to a live evidence source' },
        { id: 'third-party', name: 'Third-party risk', description: 'Security profile verification of closed-source vendor SDKs.', status: 'Unverified', score: 94, weight: 75, evidence: 'Not yet connected to a live evidence source' },
        { id: 'build-pipe', name: 'Build pipeline trust', description: 'Zero manual compilation injections on ephemeral run steps.', status: 'Unverified', score: 100, weight: 100, evidence: 'Not yet connected to a live evidence source' },
        { id: 'cicd-trust', name: 'CI/CD trust', description: 'Cryptographic pinning of action steps (relying on commit SHAs).', status: 'Unverified', score: 98, weight: 85, evidence: 'Not yet connected to a live evidence source' },
        { id: 'sbom-quality', name: 'SBOM quality', description: 'NTIA compliance of Software Bill of Materials.', status: 'Unverified', score: 100, weight: 90, evidence: 'Not yet connected to a live evidence source' },
        { id: 'pkg-signing', name: 'Package signing', description: 'Registry validation of publisher public signature keys.', status: 'Unverified', score: 97, weight: 80, evidence: 'Not yet connected to a live evidence source' },
        { id: 'dep-freshness', name: 'Dependency freshness', description: 'Time delta of active packages compared to latest releases.', status: 'Unverified', score: 92, weight: 60, evidence: 'Not yet connected to a live evidence source' }
      ]
    },
    {
      id: 'infrastructure',
      name: 'Infrastructure Trust',
      emoji: '☁️',
      overallScore: 95,
      description: 'Dynamic host monitoring, IaC template checks, cloud network barriers, and encrypted backup schedules.',
      metrics: [
        { id: 'cloud-sec', name: 'Cloud security', description: 'CIS Cloud Benchmark compliance reports on target cloud assets.', status: 'Unverified', score: 96, weight: 80, evidence: 'Not yet connected to a live evidence source' },
        { id: 'server-health', name: 'Server health', description: 'Telemetry reports on host CPU spikes, disk, and memory loads.', status: 'Unverified', score: 98, weight: 50, evidence: 'Not yet connected to a live evidence source' },
        { id: 'k8s-trust', name: 'Kubernetes trust', description: 'Validation of Pod Security Standards (restricted mode active).', status: 'Unverified', score: 100, weight: 90, evidence: 'Not yet connected to a live evidence source' },
        { id: 'vm-trust', name: 'VM trust', description: 'Confidential Computing shielded VM assertions in cloud.', status: 'Unverified', score: 95, weight: 85, evidence: 'Not yet connected to a live evidence source' },
        { id: 'container-sec', name: 'Container security', description: 'Pruning of unnecessary root privileges and non-writable files.', status: 'Unverified', score: 99, weight: 95, evidence: 'Not yet connected to a live evidence source' },
        { id: 'iac', name: 'Infrastructure as Code', description: 'Security scans of Terraform scripts prior to deployments.', status: 'Unverified', score: 92, weight: 70, evidence: 'Not yet connected to a live evidence source' },
        { id: 'dns-trust', name: 'DNS trust', description: 'DNSSEC valid signatures and zone transfer blockages.', status: 'Unverified', score: 100, weight: 60, evidence: 'Not yet connected to a live evidence source' },
        { id: 'cdn-trust', name: 'CDN trust', description: 'SSL profiles, rate limits, and DDoS mitigation thresholds.', status: 'Unverified', score: 98, weight: 75, evidence: 'Not yet connected to a live evidence source' },
        { id: 'backup-trust', name: 'Backup trust', description: 'Immutable daily backup snapshots with automatic restores.', status: 'Unverified', score: 97, weight: 90, evidence: 'Not yet connected to a live evidence source' }
      ]
    },
    {
      id: 'ai',
      name: 'AI Trust',
      emoji: '🤖',
      overallScore: 92,
      description: 'Model provenance validation, hallucination risk bounds, prompt security filters, and training dataset audits.',
      metrics: [
        { id: 'ai-prov', name: 'AI model provenance', description: 'Cryptographic binding to official weights publisher (Google).', status: 'Unverified', score: 100, weight: 95, evidence: 'Not yet connected to a live evidence source' },
        { id: 'ai-halluc', name: 'AI hallucination risk', description: 'Continuous ground-truth context injection and scoring audits.', status: 'Calibrating', score: 85, weight: 80, evidence: 'Not yet connected to a live evidence source' },
        { id: 'ai-explain', name: 'AI explainability', description: 'Verifiable audit logging of prompt context and agent reasoning.', status: 'Unverified', score: 94, weight: 85, evidence: 'Not yet connected to a live evidence source' },
        { id: 'ai-safety', name: 'AI safety', description: 'Strict classification filters preventing hazardous code releases.', status: 'Unverified', score: 98, weight: 90, evidence: 'Not yet connected to a live evidence source' },
        { id: 'ai-gov', name: 'AI governance', description: 'Model inventory registry and legal risk mapping structures.', status: 'Unverified', score: 90, weight: 70, evidence: 'Not yet connected to a live evidence source' },
        { id: 'ai-agent', name: 'AI agent trust', description: 'Restricted execution sandboxes for autonomous agent tools.', status: 'Unverified', score: 92, weight: 95, evidence: 'Not yet connected to a live evidence source' },
        { id: 'prompt-sec', name: 'Prompt security', description: 'Active protection barriers against jailbreaks and injections.', status: 'Unverified', score: 95, weight: 90, evidence: 'Not yet connected to a live evidence source' },
        { id: 'training-data', name: 'Training data quality', description: 'Checks for copyrighted code or licensed material contamination.', status: 'Unverified', score: 88, weight: 60, evidence: 'Not yet connected to a live evidence source' },
        { id: 'model-ver', name: 'Model versioning', description: 'Pinning model releases to avoid surprise behavioral drift.', status: 'Unverified', score: 100, weight: 75, evidence: 'Not yet connected to a live evidence source' }
      ]
    },
    {
      id: 'operations',
      name: 'Operational Trust',
      emoji: '📊',
      overallScore: 99,
      description: 'Service uptime logs, false-positive filter metrics, and active SLA compliance trackers.',
      metrics: [
        { id: 'uptime', name: 'Uptime', description: 'Hourly availability records of server endpoints.', status: 'Unverified', score: 100, weight: 90, evidence: 'Not yet connected to a live evidence source' },
        { id: 'performance-op', name: 'Performance', description: 'Latency and error rate statistics under high user loads.', status: 'Unverified', score: 98, weight: 70, evidence: 'Not yet connected to a live evidence source' },
        { id: 'monitoring-op', name: 'Monitoring', description: 'Trigger alerts coverage and synthetic endpoint ping cycles.', status: 'Unverified', score: 99, weight: 80, evidence: 'Not yet connected to a live evidence source' },
        { id: 'incident', name: 'Incident response', description: 'Mean-time-to-detection and automated alert rotations.', status: 'Unverified', score: 95, weight: 75, evidence: 'Not yet connected to a live evidence source' },
        { id: 'alert-qual', name: 'Alert quality', description: 'Noise reduction indices preventing operator fatigue.', status: 'Unverified', score: 92, weight: 50, evidence: 'Not yet connected to a live evidence source' },
        { id: 'disaster', name: 'Disaster recovery', description: 'Automated multi-region DNS failover response speeds.', status: 'Unverified', score: 100, weight: 90, evidence: 'Not yet connected to a live evidence source' },
        { id: 'continuity', name: 'Business continuity', description: 'Annual drills validation certificates and recovery times.', status: 'Unverified', score: 95, weight: 70, evidence: 'Not yet connected to a live evidence source' },
        { id: 'failover', name: 'Failover readiness', description: 'Weekly hot-standby database synchronization profiles.', status: 'Unverified', score: 99, weight: 85, evidence: 'Not yet connected to a live evidence source' },
        { id: 'sla-perf', name: 'SLA performance', description: 'Commitment mappings compared to live target compliance.', status: 'Unverified', score: 100, weight: 80, evidence: 'Not yet connected to a live evidence source' }
      ]
    },
    {
      id: 'compliance',
      name: 'Compliance Trust',
      emoji: '📜',
      overallScore: 98,
      description: 'Direct mapping of active evidence bags to SOC 2, ISO 27001, NIST, and GDPR criteria.',
      metrics: [
        { id: 'soc2', name: 'SOC 2', description: 'Trust Services Criteria coverage maps for security and integrity.', status: 'Unverified', score: 100, weight: 100, evidence: 'Not yet connected to a live evidence source' },
        { id: 'iso27001', name: 'ISO 27001', description: 'Information Security Management System control validation.', status: 'Unverified', score: 98, weight: 95, evidence: 'Not yet connected to a live evidence source' },
        { id: 'pci-dss', name: 'PCI DSS', description: 'Audited card processing standards (prohibiting raw card caching).', status: 'Unverified', score: 95, weight: 85, evidence: 'Not yet connected to a live evidence source' },
        { id: 'hipaa', name: 'HIPAA', description: 'Encryption and access controls securing protected health records.', status: 'Unverified', score: 96, weight: 80, evidence: 'Not yet connected to a live evidence source' },
        { id: 'gdpr', name: 'GDPR', description: 'Right to erasure and regional user data boundary controls.', status: 'Unverified', score: 100, weight: 90, evidence: 'Not yet connected to a live evidence source' },
        { id: 'nist', name: 'NIST', description: 'Conformity metrics matching Secure Software Development Framework.', status: 'Unverified', score: 99, weight: 90, evidence: 'Not yet connected to a live evidence source' },
        { id: 'cis', name: 'CIS', description: 'CIS Benchmarks implementation audits across compute nodes.', status: 'Unverified', score: 97, weight: 75, evidence: 'Not yet connected to a live evidence source' },
        { id: 'freshness', name: 'Evidence freshness', description: 'Average age of supporting compliance documents on record.', status: 'Unverified', score: 95, weight: 70, evidence: 'Not yet connected to a live evidence source' },
        { id: 'audit-readiness', name: 'Audit readiness', description: 'Instantly compilable compliance packets for external auditors.', status: 'Unverified', score: 100, weight: 80, evidence: 'Not yet connected to a live evidence source' }
      ]
    },
    {
      id: 'privacy',
      name: 'Privacy Trust',
      emoji: '🔒',
      overallScore: 100,
      description: 'Audit tracking of GDPR data deletion procedures, access logs, and residency rules.',
      metrics: [
        { id: 'data-encrypt', name: 'Data encryption', description: 'At-rest and in-transit full disk encryption keys.', status: 'Unverified', score: 100, weight: 100, evidence: 'Not yet connected to a live evidence source' },
        { id: 'retention', name: 'Data retention', description: 'Automated database purging schedules of expired profiles.', status: 'Unverified', score: 100, weight: 85, evidence: 'Not yet connected to a live evidence source' },
        { id: 'consent', name: 'User consent', description: 'Telemetry preferences storage with complete opt-out settings.', status: 'Unverified', score: 100, weight: 80, evidence: 'Not yet connected to a live evidence source' },
        { id: 'residency', name: 'Data residency', description: 'Pinning computation assets to localized cloud cluster regions.', status: 'Unverified', score: 100, weight: 95, evidence: 'Not yet connected to a live evidence source' },
        { id: 'deletion', name: 'Right to deletion', description: 'Cascading GDPR offboarding triggers removing tenant context.', status: 'Unverified', score: 100, weight: 100, evidence: 'Not yet connected to a live evidence source' },
        { id: 'access-log', name: 'Access logging', description: 'Immutable logging of administrative query statements.', status: 'Unverified', score: 100, weight: 90, evidence: 'Not yet connected to a live evidence source' },
        { id: 'privacy-impact', name: 'Privacy impact', description: 'PII parsing check on telemetry variables.', status: 'Unverified', score: 100, weight: 75, evidence: 'Not yet connected to a live evidence source' }
      ]
    },
    {
      id: 'vendor',
      name: 'Vendor Trust',
      emoji: '🏢',
      overallScore: 93,
      description: 'Third-party vendor financial ratings, liability coverage, SLA guarantees, and security history.',
      metrics: [
        { id: 'fin-stable', name: 'Financial stability', description: 'Credit worthiness and market capitalization ratings.', status: 'Unverified', score: 95, weight: 50, evidence: 'Not yet connected to a live evidence source' },
        { id: 'supp-qual', name: 'Support quality', description: 'Contracted support response times and coverage schedules.', status: 'Unverified', score: 92, weight: 60, evidence: 'Not yet connected to a live evidence source' },
        { id: 'prod-maturity', name: 'Product maturity', description: 'Liveliness lifecycle mapping preventing deprecation risks.', status: 'Unverified', score: 90, weight: 55, evidence: 'Not yet connected to a live evidence source' },
        { id: 'cust-sat', name: 'Customer satisfaction', description: 'External NPS and user review indexes.', status: 'Unverified', score: 94, weight: 40, evidence: 'Not yet connected to a live evidence source' },
        { id: 'sec-hist', name: 'Security history', description: 'Chronology of public breach events and patch schedules.', status: 'Unverified', score: 98, weight: 90, evidence: 'Not yet connected to a live evidence source' },
        { id: 'inc-hist', name: 'Incident history', description: 'Historical averages of incident mitigation and notification delays.', status: 'Unverified', score: 91, weight: 75, evidence: 'Not yet connected to a live evidence source' },
        { id: 'legal-hist', name: 'Legal history', description: 'Absence of regulatory lawsuits or active corporate actions.', status: 'Unverified', score: 100, weight: 70, evidence: 'Not yet connected to a live evidence source' },
        { id: 'insurance', name: 'Insurance', description: 'Professional cyber liability insurance coverage certificates.', status: 'Unverified', score: 95, weight: 65, evidence: 'Not yet connected to a live evidence source' },
        { id: 'roadmap-conf', name: 'Roadmap confidence', description: 'Consistency of feature delivery timelines.', status: 'Unverified', score: 85, weight: 45, evidence: 'Not yet connected to a live evidence source' }
      ]
    },
    {
      id: 'community',
      name: 'Community Trust',
      emoji: '🌍',
      overallScore: 91,
      description: 'Liveliness of community-maintained open source, issue resolution velocities, and project sustainability.',
      metrics: [
        { id: 'dev-activity', name: 'Developer activity', description: 'Monthly commit counts and active developer profiles on VCS.', status: 'Unverified', score: 95, weight: 60, evidence: 'Not yet connected to a live evidence source' },
        { id: 'issue-resp', name: 'Issue response', description: 'Averages of close delays for reported GitHub bugs.', status: 'Unverified', score: 88, weight: 55, evidence: 'Not yet connected to a live evidence source' },
        { id: 'release-freq', name: 'Release frequency', description: 'Regular deployment schedules and semver adherence.', status: 'Unverified', score: 94, weight: 50, evidence: 'Not yet connected to a live evidence source' },
        { id: 'doc-qual', name: 'Documentation quality', description: 'Breadth of code comments, setup tutorials, and API wikis.', status: 'Unverified', score: 92, weight: 40, evidence: 'Not yet connected to a live evidence source' },
        { id: 'comm-supp', name: 'Community support', description: 'Liveliness scores of public Discord or Stack Overflow channels.', status: 'Unverified', score: 85, weight: 30, evidence: 'Not yet connected to a live evidence source' },
        { id: 'maint-diversity', name: 'Maintainer diversity', description: 'Checking distribution of commits across distinct firms.', status: 'Unverified', score: 89, weight: 65, evidence: 'Not yet connected to a live evidence source' },
        { id: 'proj-sust', name: 'Project sustainability', description: 'Backing of reliable foundations and open source associations.', status: 'Unverified', score: 95, weight: 70, evidence: 'Not yet connected to a live evidence source' }
      ]
    },
    {
      id: 'business',
      name: 'Business Trust',
      emoji: '💼',
      overallScore: 94,
      description: 'Alignment of product roadmaps with compliance targets, corporate longevity, and service ecosystems.',
      metrics: [
        { id: 'prod-roadmap', name: 'Product roadmap', description: 'Publishing schedule and transparent security commitment timelines.', status: 'Unverified', score: 96, weight: 50, evidence: 'Not yet connected to a live evidence source' },
        { id: 'company-long', name: 'Company longevity', description: 'Years in active service of client networks.', status: 'Unverified', score: 100, weight: 40, evidence: 'Not yet connected to a live evidence source' },
        { id: 'rev-stable', name: 'Revenue stability', description: 'Audited financial reports and credit indexes.', status: 'Unverified', score: 92, weight: 45, evidence: 'Not yet connected to a live evidence source' },
        { id: 'reputation', name: 'Market reputation', description: 'Analyst ratings and peer-to-peer industry surveys.', status: 'Unverified', score: 91, weight: 55, evidence: 'Not yet connected to a live evidence source' },
        { id: 'retention-biz', name: 'Customer retention', description: 'Retention percentages and customer longevity rates.', status: 'Unverified', score: 95, weight: 60, evidence: 'Not yet connected to a live evidence source' },
        { id: 'partner-eco', name: 'Partner ecosystem', description: 'Audited directory of certified system integrators.', status: 'Unverified', score: 96, weight: 40, evidence: 'Not yet connected to a live evidence source' }
      ]
    },
    {
      id: 'performance',
      name: 'Performance Trust',
      emoji: '⚡',
      overallScore: 97,
      description: 'System microservice latencies, autoscale responsiveness, and system error rates.',
      metrics: [
        { id: 'speed', name: 'Speed', description: 'End-user site speed and asset delivery performance.', status: 'Unverified', score: 98, weight: 80, evidence: 'Not yet connected to a live evidence source' },
        { id: 'scalability', name: 'Scalability', description: 'Capacity scale times under high simulated concurrent users.', status: 'Unverified', score: 95, weight: 70, evidence: 'Not yet connected to a live evidence source' },
        { id: 'reliability', name: 'Reliability', description: 'Calculated ratios of successful transactions under peak load.', status: 'Unverified', score: 99, weight: 90, evidence: 'Not yet connected to a live evidence source' },
        { id: 'latency', name: 'Latency', description: 'Relational database query and API fetch latency statistics.', status: 'Unverified', score: 98, weight: 75, evidence: 'Not yet connected to a live evidence source' },
        { id: 'efficiency', name: 'Resource efficiency', description: 'Server RAM and compute core usage parameters.', status: 'Unverified', score: 94, weight: 55, evidence: 'Not yet connected to a live evidence source' },
        { id: 'capacity', name: 'Capacity planning', description: 'Available headroom buffer before cluster scaling limits.', status: 'Unverified', score: 96, weight: 65, evidence: 'Not yet connected to a live evidence source' }
      ]
    },
    {
      id: 'data',
      name: 'Data Trust',
      emoji: '🗂️',
      overallScore: 98,
      description: 'Immutable storage logs, schema validations, and relational database constraints.',
      metrics: [
        { id: 'data-qual', name: 'Data quality', description: 'Checks for duplicates, null-block errors, and correct inputs.', status: 'Unverified', score: 99, weight: 80, evidence: 'Not yet connected to a live evidence source' },
        { id: 'data-acc', name: 'Data accuracy', description: 'Matching rates of synchronized tenant tables.', status: 'Unverified', score: 100, weight: 90, evidence: 'Not yet connected to a live evidence source' },
        { id: 'data-lineage', name: 'Data lineage', description: 'Tracing data mutations through relational join histories.', status: 'Unverified', score: 97, weight: 75, evidence: 'Not yet connected to a live evidence source' },
        { id: 'data-own', name: 'Data ownership', description: 'Database role limitations isolating admin accounts.', status: 'Unverified', score: 100, weight: 85, evidence: 'Not yet connected to a live evidence source' },
        { id: 'data-val', name: 'Data validation', description: 'String schema parsing prior to database entries.', status: 'Unverified', score: 98, weight: 70, evidence: 'Not yet connected to a live evidence source' },
        { id: 'data-int', name: 'Data integrity', description: 'Physical storage checksum matching of ledger databases.', status: 'Unverified', score: 99, weight: 95, evidence: 'Not yet connected to a live evidence source' }
      ]
    },
    {
      id: 'human',
      name: 'Human Trust',
      emoji: '👥',
      overallScore: 93,
      description: 'Insider risk scores, biometric session approvals, and change management logs.',
      metrics: [
        { id: 'admin-trust', name: 'Administrator trust', description: 'Temporal validation logs on critical setup parameters.', status: 'Unverified', score: 95, weight: 90, evidence: 'Not yet connected to a live evidence source' },
        { id: 'insider', name: 'Insider risk', description: 'Four-eyes approval protocols required for production releases.', status: 'Unverified', score: 90, weight: 95, evidence: 'Not yet connected to a live evidence source' },
        { id: 'priv-access', name: 'Privileged access', description: 'Expiry timers on admin session access privileges.', status: 'Unverified', score: 96, weight: 85, evidence: 'Not yet connected to a live evidence source' },
        { id: 'awareness', name: 'Security awareness', description: 'Verified credentials of employees on secure compliance tracks.', status: 'Unverified', score: 91, weight: 50, evidence: 'Not yet connected to a live evidence source' },
        { id: 'change-app', name: 'Change approval', description: 'Mandatory co-signed tickets tied to pipeline code commits.', status: 'Unverified', score: 95, weight: 80, evidence: 'Not yet connected to a live evidence source' },
        { id: 'gov-maturity', name: 'Governance maturity', description: 'Corporate security policies alignment with ISO standards.', status: 'Unverified', score: 92, weight: 60, evidence: 'Not yet connected to a live evidence source' }
      ]
    },
    {
      id: 'future',
      name: 'Future Trust',
      emoji: '🔮',
      overallScore: 90,
      description: 'Support for quantum-resistant ciphers, clean code maintainability, and end-of-life maps.',
      metrics: [
        { id: 'quantum', name: 'Quantum readiness', description: 'Post-quantum cryptographic algorithms validation trials.', status: 'Calibrating', score: 75, weight: 85, evidence: 'Not yet connected to a live evidence source' },
        { id: 'maintain', name: 'Long-term maintainability', description: 'Static analysis grades of codebase structure.', status: 'Unverified', score: 94, weight: 65, evidence: 'Not yet connected to a live evidence source' },
        { id: 'tech-debt', name: 'Technical debt', description: 'Automated complexity metrics identifying modularity issues.', status: 'Unverified', score: 90, weight: 50, evidence: 'Not yet connected to a live evidence source' },
        { id: 'eol', name: 'End-of-life planning', description: 'Schedules mapping upcoming deprecation profiles of assets.', status: 'Unverified', score: 96, weight: 55, evidence: 'Not yet connected to a live evidence source' },
        { id: 'sustain', name: 'Sustainability', description: 'Server infrastructure carbon rating checks.', status: 'Unverified', score: 92, weight: 40, evidence: 'Not yet connected to a live evidence source' },
        { id: 'climate', name: 'Climate impact', description: 'Renewable energy percentages of physical server grids.', status: 'Unverified', score: 91, weight: 30, evidence: 'Not yet connected to a live evidence source' }
      ]
    },
    {
      id: 'innovation',
      name: 'Innovation (SPR‑exclusive)',
      emoji: '⭐',
      overallScore: 95,
      description: 'State-of-the-art trust parameters pioneered by SPR—confidence intervals, trust momentum, and prediction algorithms.',
      metrics: [
        { id: 'evidence-trust', name: 'Evidence Trust', description: 'How much of the score is based on independently verified evidence.', status: 'Unverified', score: 100, weight: 100, evidence: 'Not yet connected to a live evidence source' },
        { id: 'ver-confidence', name: 'Verification Confidence', description: 'How confident SPR is in its own assessment based on scanner coverage.', status: 'Unverified', score: 98, weight: 95, evidence: 'Not yet connected to a live evidence source' },
        { id: 'predict-trust', name: 'Prediction Trust', description: 'Likelihood of future security or reliability issues based on patterns.', status: 'Unverified', score: 91, weight: 85, evidence: 'Not yet connected to a live evidence source' },
        { id: 'recover-conf', name: 'Recovery Confidence', description: 'Evidence that recovery processes have been tested successfully.', status: 'Unverified', score: 95, weight: 90, evidence: 'Not yet connected to a live evidence source' },
        { id: 'transparency', name: 'Transparency Trust', description: 'How openly a vendor communicates incidents and changes.', status: 'Unverified', score: 94, weight: 75, evidence: 'Not yet connected to a live evidence source' },
        { id: 'knowledge-trust', name: 'Knowledge Trust', description: 'Whether critical knowledge is documented rather than concentrated.', status: 'Unverified', score: 89, weight: 65, evidence: 'Not yet connected to a live evidence source' },
        { id: 'decision-trust', name: 'Decision Trust', description: 'Whether AI or automated decisions are explainable and auditable.', status: 'Unverified', score: 95, weight: 80, evidence: 'Not yet connected to a live evidence source' },
        { id: 'change-stability', name: 'Change Stability Trust', description: 'Whether changes are introduced at a sustainable, low-risk pace.', status: 'Unverified', score: 96, weight: 70, evidence: 'Not yet connected to a live evidence source' },
        { id: 'trust-drift', name: 'Trust Drift', description: 'How much the software\'s trust profile has changed over time.', status: 'Unverified', score: 92, weight: 85, evidence: 'Not yet connected to a live evidence source' },
        { id: 'ev-freshness', name: 'Evidence Freshness', description: 'How current the supporting evidence is across all scans.', status: 'Unverified', score: 99, weight: 95, evidence: 'Not yet connected to a live evidence source' },
        { id: 'momentum', name: 'Trust Momentum', description: 'Whether trust is improving, declining, or stable.', status: 'Unverified', score: 97, weight: 90, evidence: 'Not yet connected to a live evidence source' }
      ]
    }
  ]);

  // Interactive weight slider helper - recalibrates domain score instantly
  const updateMetricWeight = (domainId: string, metricId: string, newWeight: number) => {
    setDomains(prevDomains => {
      return prevDomains.map(dom => {
        if (dom.id !== domainId) return dom;
        
        // Map metrics and update the specific weight
        const updatedMetrics = dom.metrics.map(met => {
          if (met.id === metricId) {
            return { ...met, weight: newWeight };
          }
          return met;
        });
        
        // Recalculate dynamic weighted overallScore
        const totalWeight = updatedMetrics.reduce((sum, m) => sum + m.weight, 0);
        let newScore = dom.overallScore;
        if (totalWeight > 0) {
          const weightedSum = updatedMetrics.reduce((sum, m) => sum + (m.score * m.weight), 0);
          newScore = Math.round(weightedSum / totalWeight);
        } else {
          const sumScore = updatedMetrics.reduce((sum, m) => sum + m.score, 0);
          newScore = Math.round(sumScore / updatedMetrics.length);
        }
        
        return {
          ...dom,
          metrics: updatedMetrics,
          overallScore: newScore
        };
      });
    });
  };

  // Programmatic, co-signed verification rules linked perfectly to domain categories
  const rules: RuleDefinition[] = [
    // 1. Identity Trust Rules
    {
      id: 'rule-core-1',
      name: 'Visibility‑Existence Rule',
      description: 'If the system cannot see it, fetch it, or inspect it, it does not exist. No blind spots or unverifiable dependencies are permitted in any registered software passport.',
      category: 'identity',
      status: 'Defined',
      severity: 'Critical',
      auditProof: 'framework-definition-only — no live cryptographic seal exists for this rule',
      liveAssertions: [
        'Mandates external URI resolution prior to SBOM packaging',
        'Fails immediately if any dependency artifact metadata returns 404/Timeout',
        'Blocks unindexed build-time source archives'
      ]
    },
    {
      id: 'rule-core-3',
      name: 'Identity‑Binding Rule',
      description: 'Every deployment, code modification, or metadata attestation must be bound to a cryptographically verified and authorized user or machine identity.',
      category: 'identity',
      status: 'Defined',
      severity: 'Critical',
      auditProof: 'framework-definition-only — no live cryptographic seal exists for this rule',
      liveAssertions: [
        'Authenticates actions via hardware HSM or OpenID Connect (OIDC) tokens',
        'Rejects keys with deprecated algorithm strengths (RSA-2048 revoked, requires ECDSA-384+)',
        'Binds temporal access privileges strictly to build pipeline lifetime duration'
      ]
    },
    {
      id: 'rule-gov-3',
      name: 'Org‑Identity Rule',
      description: 'All participating client organizations, vendor tenants, and auditing firms must possess cryptographically verified, active organizational profiles.',
      category: 'identity',
      status: 'Defined',
      severity: 'Medium',
      auditProof: 'framework-definition-only — no live cryptographic seal exists for this rule',
      liveAssertions: [
        'Enforces strict tenant boundaries via isolated key management partitions',
        'Requires organizational DUNS or registry validations to onboard production vendors',
        'Authenticates MSP administrators using multi-factor biometric standards'
      ]
    },
    {
      id: 'rule-ind-4',
      name: 'Universal Passport Rule',
      description: 'Every artifact, package, library, or configuration file must receive its own distinct Software Passport and cryptographically signed identity.',
      category: 'identity',
      status: 'Defined',
      severity: 'Critical',
      auditProof: 'framework-definition-only — no live cryptographic seal exists for this rule',
      liveAssertions: [
        'Auto-provisions distinct passport schemas for microservice containers',
        'Maintains metadata links across subcomponents'
      ]
    },
    {
      id: 'rule-found-6',
      name: 'Identity Binding Rule',
      description: 'Confirms code signature authors have valid active organization profiles before accepting code registration.',
      category: 'identity',
      status: 'Defined',
      severity: 'High',
      auditProof: 'framework-definition-only — no live cryptographic seal exists for this rule',
      liveAssertions: [
        'Validates GPG signatures against official employee email directories'
      ]
    },

    // 2. Source Trust Rules
    {
      id: 'rule-core-2',
      name: 'Provenance‑Integrity Rule',
      description: 'Every artifact must have a complete, unbroken provenance chain mapping from compilation environments directly back to developer VCS signatures.',
      category: 'source',
      status: 'Defined',
      severity: 'Critical',
      auditProof: 'framework-definition-only — no live cryptographic seal exists for this rule',
      liveAssertions: [
        'Enforces Sigstore Cosign signature checks for Docker layers',
        'Validates git-commit-gpg binding against the official pipeline runner identity',
        'Guarantees zero manual code injections on compilation steps'
      ]
    },
    {
      id: 'rule-core-6',
      name: 'Artifact‑Lineage Rule',
      description: 'Every software artifact must trace back to its exact upstream open-source or proprietary source-code repository without missing parent dependencies.',
      category: 'source',
      status: 'Defined',
      severity: 'High',
      auditProof: 'framework-definition-only — no live cryptographic seal exists for this rule',
      liveAssertions: [
        'Constructs a directed acyclic graph (DAG) of the full file/package history',
        'Rejects virtual circular dependency paths during repository scans',
        'Ensures upstream transit routes are secure and cryptographically proven'
      ]
    },
    {
      id: 'rule-ind-2',
      name: 'Full‑Chain Rule',
      description: 'Every software passport must contain a complete, unbroken cryptographic custody trail from the first lines of code to container launch.',
      category: 'source',
      status: 'Defined',
      severity: 'Critical',
      auditProof: 'framework-definition-only — no live cryptographic seal exists for this rule',
      liveAssertions: [
        'Validates signatures at developer push, build compilation, and server deploy',
        'Blocks package distribution if any link in the provenance chain is broken',
        'Maintains full accountability profiles for automated CI systems'
      ]
    },
    {
      id: 'rule-found-5',
      name: 'Artifact Lineage Rule',
      description: 'Ensures parent dependency packages can trace lineage directly back to verified repository sources.',
      category: 'source',
      status: 'Defined',
      severity: 'High',
      auditProof: 'framework-definition-only — no live cryptographic seal exists for this rule',
      liveAssertions: [
        'Reconstructs deep dependencies trees during repository uploads'
      ]
    },

    // 3. Security Trust Rules
    {
      id: 'rule-graph-6',
      name: 'Conflict‑Resolution Rule',
      description: 'Any conflicting or contradictory evidence automatically triggers an immediate trust drop and broadcasts a compliance violation report.',
      category: 'security',
      status: 'Defined',
      severity: 'Critical',
      auditProof: 'framework-definition-only — no live cryptographic seal exists for this rule',
      liveAssertions: [
        'Locks the affected software passport instantly upon finding signature mismatches',
        'Triggers alert notifications to MSP security operations centers',
        'Flags conflicted source streams for dynamic rule isolation and forensic analysis'
      ]
    },
    {
      id: 'rule-mon-4',
      name: 'Tamper‑Alert Rule',
      description: 'Any unauthorized modify or delete attempts on evidence, logs, or software passports trigger severe system warnings.',
      category: 'security',
      status: 'Defined',
      severity: 'Critical',
      auditProof: 'framework-definition-only — no live cryptographic seal exists for this rule',
      liveAssertions: [
        'Monitors ledger integrity continuously with background daemon watchdogs',
        'Sounds alerts via Slack, Microsoft Teams, and webhook integrations',
        'Implements immediate isolation protocol for affected client workspaces'
      ]
    },

    // 4. Supply Chain Trust Rules
    {
      id: 'rule-core-5',
      name: 'Pipeline‑Integrity Rule',
      description: 'Pipeline outputs must exactly match the declared declarative pipeline definition. Rebuilds from source code must produce bit-for-bit identical cryptographic assets.',
      category: 'supply_chain',
      status: 'Defined',
      severity: 'High',
      auditProof: 'framework-definition-only — no live cryptographic seal exists for this rule',
      liveAssertions: [
        'Enforces reproducible build environment constraints (isolated, hermetic compilers)',
        'Saves build container image hashes inside the software passport signature envelope',
        'Compares dynamic execution memory maps to target expected profiles'
      ]
    },
    {
      id: 'rule-core-8',
      name: 'Non‑Ghost Data Rule',
      description: 'No invisible, unverifiable, or unreferenced dependencies may be loaded at runtime. Rejects packages with obfuscated source files or hidden build outputs.',
      category: 'supply_chain',
      status: 'Defined',
      severity: 'Critical',
      auditProof: 'framework-definition-only — no live cryptographic seal exists for this rule',
      liveAssertions: [
        'Parses target binaries for dynamic library load commands (dlopen, DynamicLink)',
        'Unpacks hidden folders within node_modules directories during build pipelines',
        'Blocks encrypted source archives lacking accompanying decryption keys'
      ]
    },
    {
      id: 'rule-mon-3',
      name: 'Pipeline‑Drift Rule',
      description: 'Dynamic pipeline definitions are validated against original configuration parameters to prevent unauthorized workflow injections.',
      category: 'supply_chain',
      status: 'Defined',
      severity: 'High',
      auditProof: 'framework-definition-only — no live cryptographic seal exists for this rule',
      liveAssertions: [
        'Compares current GitHub Actions/GitLab CI yaml hashes against original registered configurations',
        'Blocks unapproved runners from publishing assets to the release registry'
      ]
    },
    {
      id: 'rule-ind-1',
      name: 'Zero‑Ghost Rule',
      description: 'Absolutely zero invisible dependencies, blind builds, or unmapped software components allowed inside production registers. Absolute visibility is mandatory.',
      category: 'supply_chain',
      status: 'Defined',
      severity: 'Critical',
      auditProof: 'framework-definition-only — no live cryptographic seal exists for this rule',
      liveAssertions: [
        'Halts dynamic container deployments if an unknown module is loaded',
        'Rejects build logs containing closed-source, pre-compiled binary blobs',
        'Requires source verification hashes for every package module'
      ]
    },
    {
      id: 'rule-found-4',
      name: 'Pipeline Integrity Rule',
      description: 'Locks deployment targets if pipeline build files drift from verified master branch definitions.',
      category: 'supply_chain',
      status: 'Defined',
      severity: 'High',
      auditProof: 'framework-definition-only — no live cryptographic seal exists for this rule',
      liveAssertions: [
        'Compares run configuration digests with primary deployment charts'
      ]
    },

    // 5. Infrastructure Trust Rules
    {
      id: 'rule-graph-1',
      name: 'Node‑Existence Rule',
      description: 'A trust node in the relational asset graph exists only if it is supported by valid, inspectable cryptographic evidence.',
      category: 'infrastructure',
      status: 'Defined',
      severity: 'High',
      auditProof: 'framework-definition-only — no live cryptographic seal exists for this rule',
      liveAssertions: [
        'Prunes ghost nodes with zero active cryptographic evidence bindings',
        'Enforces strict key constraint mapping across the full system topology',
        'Fails trust calculation if node metadata cannot be verified'
      ]
    },
    {
      id: 'rule-graph-2',
      name: 'Edge‑Validity Rule',
      description: 'Relationships, bindings, and dependencies between nodes must be cryptographically proven, not inferred by loose nomenclature mapping.',
      category: 'infrastructure',
      status: 'Defined',
      severity: 'High',
      auditProof: 'framework-definition-only — no live cryptographic seal exists for this rule',
      liveAssertions: [
        'Validates caller/receiver keys on every inter-process boundary',
        'Rejects unauthenticated container microservice network requests',
        'Confirms direct pipeline lineage for child package mappings'
      ]
    },

    // 6. AI Trust Rules
    {
      id: 'rule-learn-1',
      name: 'Self‑Correction Rule',
      description: 'When fresh, certified evidence contradicts a historical rule parameter, the system flags the rule for dynamic review and automatically adapts bounds.',
      category: 'ai',
      status: 'Defined',
      severity: 'Medium',
      auditProof: 'framework-definition-only — no live cryptographic seal exists for this rule',
      liveAssertions: [
        'Aggregates validation logs to identify safe false-positive warning patterns',
        'Drafts proposed policy parameter updates for MSP admin review',
        'Ensures updated parameters do not conflict with parent SOC 2 compliance sheets'
      ]
    },
    {
      id: 'rule-learn-2',
      name: 'Pattern‑Learning Rule',
      description: 'The cognitive system parses global trust metrics to learn common patterns of supply chain risk and automatically prioritizes scanning frequency.',
      category: 'ai',
      status: 'Defined',
      severity: 'Low',
      auditProof: 'framework-definition-only — no live cryptographic seal exists for this rule',
      liveAssertions: [
        'Groups packages with poor maintenance metrics into specialized watchlists',
        'Increases CVE scan frequencies for high-vulnerability components',
        'Learns vendor update patterns to predict software release schedules'
      ]
    },
    {
      id: 'rule-learn-3',
      name: 'Rule‑Evolution Rule',
      description: 'Policy and scanning rules evolve based on repeated security violations, establishing stronger baselines against zero-day exploit types.',
      category: 'ai',
      status: 'Defined',
      severity: 'Medium',
      auditProof: 'framework-definition-only — no live cryptographic seal exists for this rule',
      liveAssertions: [
        'Constructs new dynamic rules automatically upon recognizing repeated attacks',
        'Distributes freshly evolved compliance policies to federated tenant accounts'
      ]
    },
    {
      id: 'rule-learn-6',
      name: 'Cross‑System Learning Rule',
      description: 'Learns vulnerability patterns from external federated global trust registries and public code repositories.',
      category: 'ai',
      status: 'Defined',
      severity: 'Low',
      auditProof: 'framework-definition-only — no live cryptographic seal exists for this rule',
      liveAssertions: [
        'Syncs with public security repositories to anticipate supply chain attacks',
        'Contributes anonymous telemetry hashes to global trust networks'
      ]
    },
    {
      id: 'rule-learn-7',
      name: 'Temporal‑Learning Rule',
      description: 'Analyzes long-term decay cycles of vendor updates to optimize automated certification schedules.',
      category: 'ai',
      status: 'Defined',
      severity: 'Low',
      auditProof: 'framework-definition-only — no live cryptographic seal exists for this rule',
      liveAssertions: [
        'Predicts when package versions become obsolete based on historical metrics',
        'Informs clients when stable code requires active structural review'
      ]
    },
    {
      id: 'rule-learn-8',
      name: 'Graph‑Evolution Rule',
      description: 'Restructures trust graph edge weights dynamically as relationships and multi-party attestations change over time.',
      category: 'ai',
      status: 'Defined',
      severity: 'Medium',
      auditProof: 'framework-definition-only — no live cryptographic seal exists for this rule',
      liveAssertions: [
        'Re-orders parent/child graph node relationships to optimize query times',
        'Applies real-time trust propagation calculations across the system tree'
      ]
    },

    // 7. Operational Trust Rules
    {
      id: 'rule-mon-1',
      name: 'Continuous‑Visibility Rule',
      description: 'Visibility of software passport integrity must be continuously re-checked and refreshed on a scheduled daily rotation.',
      category: 'operations',
      status: 'Defined',
      severity: 'High',
      auditProof: 'framework-definition-only — no live cryptographic seal exists for this rule',
      liveAssertions: [
        'Monitors active package endpoints for unexpected version drift or modifications',
        'Re-validates open-source dependencies hourly against national vulnerability databases',
        'Refreshes trust node metrics inside the system dashboard automatically'
      ]
    },
    {
      id: 'rule-mon-2',
      name: 'Anomaly‑Detection Rule',
      description: 'Unexpected deviations from normal pipeline parameters or baseline library footprints trigger immediate warnings and state locks.',
      category: 'operations',
      status: 'Defined',
      severity: 'High',
      auditProof: 'framework-definition-only — no live cryptographic seal exists for this rule',
      liveAssertions: [
        'Detects package file size shifts exceeding baseline limits (+/- 5%)',
        'Flags strange dependency additions introduced without verified ticket references',
        'Monitors pipeline builds for abnormal compilation speed fluctuations'
      ]
    },

    // 8. Compliance Trust Rules
    {
      id: 'rule-gov-1',
      name: 'Policy‑Compliance Rule',
      description: 'Every software artifact must strictly comply with the specific security, license, and dependency policies set by the client organization.',
      category: 'compliance',
      status: 'Defined',
      severity: 'High',
      auditProof: 'framework-definition-only — no live cryptographic seal exists for this rule',
      liveAssertions: [
        'Validates license types (blocks SSPL, GPLv3 depending on client preference sheets)',
        'Fails builds incorporating dependencies exceeding CVSS score 7.0 threshold',
        'Enforces automated compliance rules directly inside the build pipeline'
      ]
    },
    {
      id: 'rule-gov-2',
      name: 'Standards‑Mapping Rule',
      description: 'Automatically map artifact evidence to SOC 2, ISO 27001, NIST SP 800-218 (SSDF), and CIS Critical Security Controls.',
      category: 'compliance',
      status: 'Defined',
      severity: 'Medium',
      auditProof: 'framework-definition-only — no live cryptographic seal exists for this rule',
      liveAssertions: [
        'Injects code-attestation evidence directly into SOC 2 Type II criteria records',
        'Cross-references NIST SSDF requirements with active compiler flag logs',
        'Outputs clean compliance audit trails for auditor export and review'
      ]
    },
    {
      id: 'rule-learn-4',
      name: 'Standards‑Update Rule',
      description: 'Pulls current NIST, CIS, and ISO standards changes via security API feeds and updates internal mapping guidelines automatically.',
      category: 'compliance',
      status: 'Defined',
      severity: 'Low',
      auditProof: 'framework-definition-only — no live cryptographic seal exists for this rule',
      liveAssertions: [
        'Monitors official compliance publications for framework updates',
        'Drafts newly required control checklists inside the Compliance View'
      ]
    },
    {
      id: 'rule-ind-6',
      name: 'Elite‑Standard Rule',
      description: 'Enforces strict security regulations and cryptographic mapping guidelines that go far beyond standard ISO/SOC2 regulations.',
      category: 'compliance',
      status: 'Defined',
      severity: 'Critical',
      auditProof: 'framework-definition-only — no live cryptographic seal exists for this rule',
      liveAssertions: [
        'Rejects SHA-1 or MD5 hashes across all codebases (even legacy dependencies)',
        'Requires quantum-resistant signing algorithms on critical passports',
        'Maintains continuous automated evidence collection audits'
      ]
    },

    // 9. Privacy Trust Rules
    {
      id: 'rule-found-3',
      name: 'Workspace Authorization Rule',
      description: 'Binds platform tenant actions strictly to authorized workspace spaces and verified personnel domains.',
      category: 'privacy',
      status: 'Defined',
      severity: 'High',
      auditProof: 'framework-definition-only — no live cryptographic seal exists for this rule',
      liveAssertions: [
        'Verifies active administrative claims against central OAuth credentials',
        'Maintains complete session trails with exact action stamps'
      ]
    },

    // 10. Vendor Trust Rules
    {
      id: 'rule-graph-4',
      name: 'External‑Trust Ingestion Rule',
      description: 'External security certificates and vendor credentials must be verified with target issuing bodies, timestamped, and stored in our local audit registries.',
      category: 'vendor',
      status: 'Defined',
      severity: 'Medium',
      auditProof: 'framework-definition-only — no live cryptographic seal exists for this rule',
      liveAssertions: [
        'Performs automated OCSP checks to verify external digital certificate statuses',
        'Validates vendor public keys against trusted international root certificate authorities',
        'Checks certificate revocation lists (CRLs) hourly'
      ]
    },
    {
      id: 'rule-gov-4',
      name: 'Vendor‑Attestation Rule',
      description: 'Vendors must provide signed cryptographic attestations for all software packages, libraries, or APIs delivered to clients.',
      category: 'vendor',
      status: 'Defined',
      severity: 'High',
      auditProof: 'framework-definition-only — no live cryptographic seal exists for this rule',
      liveAssertions: [
        'Ensures third-party libraries have associated vendor-certified signature anchors',
        'Verifies SBOM accuracy against live packages with cryptographic hashes',
        'Flags non-attested vendor components for isolated sandbox safety testing'
      ]
    },

    // 11. Business Trust Rules
    {
      id: 'rule-ind-5',
      name: 'Cross‑Org Federation Rule',
      description: 'Enables safe, secure multi-organizational trust sharing through federated passport verification layers.',
      category: 'business',
      status: 'Defined',
      severity: 'Medium',
      auditProof: 'framework-definition-only — no live cryptographic seal exists for this rule',
      liveAssertions: [
        'Validates partner organization public signatures without decrypting codebases',
        'Allows shared compliance checklists across separate vendor boundaries'
      ]
    },

    // 12. Human Trust Rules
    {
      id: 'rule-graph-3',
      name: 'Multi‑Party Attestation Rule',
      description: 'Trust scores increase exponentially when multiple distinct independent parties (e.g., developer, build pipeline, QA, and security) attest to the same artifact.',
      category: 'human',
      status: 'Defined',
      severity: 'Medium',
      auditProof: 'framework-definition-only — no live cryptographic seal exists for this rule',
      liveAssertions: [
        'Enforces a threshold signature requirement (M-of-N keys) for production code',
        'Applies trust premiums for verified external white-hat attestation audits',
        'Integrates multi-tenant compliance metrics into global rating matrices'
      ]
    },
    {
      id: 'rule-ind-3',
      name: 'Multi‑Signature Rule',
      description: 'Critical software artifacts require multiple distinct, authorized organization signatures before being permitted in the active production registry.',
      category: 'human',
      status: 'Defined',
      severity: 'High',
      auditProof: 'framework-definition-only — no live cryptographic seal exists for this rule',
      liveAssertions: [
        'Requires distinct keys from Dev, Ops, and Security to release software',
        'Implements automated hardware key token aggregation protocols'
      ]
    },

    // 13. Data Trust Rules
    {
      id: 'rule-core-4',
      name: 'Evidence‑Immutability Rule',
      description: 'Evidence cannot be modified or deleted after ingestion. Every entry in the software passport is written to a write-once, read-many (WORM) tamperproof ledger.',
      category: 'data',
      status: 'Defined',
      severity: 'Critical',
      auditProof: 'framework-definition-only — no live cryptographic seal exists for this rule',
      liveAssertions: [
        'Pre-computes double-hash HMAC matrices for each transaction block',
        'Triggers automated blockchain anchor verification upon registry access',
        'Treats deletion requests as fatal database integrity violations'
      ]
    },
    {
      id: 'rule-found-1',
      name: 'HMAC Evidence Rule',
      description: 'Computes cryptographic HMAC matrices on ingested evidence packages to guarantee absolute data integrity.',
      category: 'data',
      status: 'Defined',
      severity: 'Critical',
      auditProof: 'framework-definition-only — no live cryptographic seal exists for this rule',
      liveAssertions: [
        'Encrypts evidence files with AES-GCM and hashes verification chains',
        'Performs static checksum matches on files'
      ]
    },
    {
      id: 'rule-found-2',
      name: 'Immutability Trigger Rule',
      description: 'Triggers system alerts and revokes validation badges automatically if any historical record edit is attempted.',
      category: 'data',
      status: 'Defined',
      severity: 'Critical',
      auditProof: 'framework-definition-only — no live cryptographic seal exists for this rule',
      liveAssertions: [
        'Hooks directly into base database transactions to catch edit commands',
        'Restricts manual database write operations to secure authorized systems'
      ]
    },

    // 14. Innovation / Exclusive Rules
    {
      id: 'rule-core-7',
      name: 'Truthfulness‑Scoring Rule',
      description: 'Truthfulness must be dynamically computed based on active evidence and multi-party cryptographic validation, not assumed by static reputation ratings.',
      category: 'innovation',
      status: 'Defined',
      severity: 'High',
      auditProof: 'framework-definition-only — no live cryptographic seal exists for this rule',
      liveAssertions: [
        'Recalculates trust score coefficients every 15 minutes',
        'Applies severe penalties for outdated scan definitions or missing attestations',
        'Requires continuous active heartbeat logs to maintain top tier rating'
      ]
    },
    {
      id: 'rule-core-9',
      name: 'Cross‑Verification Rule',
      description: 'System claims must be verified by multiple independent evidence sources, such as independent SBOM audits, security scanners, and VCS tags.',
      category: 'innovation',
      status: 'Defined',
      severity: 'Medium',
      auditProof: 'framework-definition-only — no live cryptographic seal exists for this rule',
      liveAssertions: [
        'Correlates Trivy scans with internal Snyk reports to verify vulnerability counts',
        'Ensures multi-scanner agreement on package licensing classifications',
        'Flags conflicting reports as warnings needing immediate human triage'
      ]
    },
    {
      id: 'rule-core-10',
      name: 'Temporal‑Truth Rule',
      description: 'Truthfulness values decay rapidly over time unless continuously re-verified with fresh evidence and automated compliance scans.',
      category: 'innovation',
      status: 'Defined',
      severity: 'Medium',
      auditProof: 'framework-definition-only — no live cryptographic seal exists for this rule',
      liveAssertions: [
        'Applies a 15% trust degradation score penalty for each month without scans',
        'Requires a fresh CVE scan every 24 hours to preserve the Secure label',
        'Triggers automated re-scan tasks if pipeline inputs remain static for 30 days'
      ]
    },
    {
      id: 'rule-graph-5',
      name: 'Trust‑Decay Rule',
      description: 'Trust in relationships decays exponentially over time without fresh, automated multi-party attestations.',
      category: 'innovation',
      status: 'Defined',
      severity: 'Low',
      auditProof: 'framework-definition-only — no live cryptographic seal exists for this rule',
      liveAssertions: [
        'Reduces older node trust values using standard exponential decay metrics',
        'Auto-schedules refreshing scans for stable upstream legacy components'
      ]
    },
    {
      id: 'rule-learn-5',
      name: 'Adaptive‑Scoring Rule',
      description: 'Adjusts trust score calculations based on the emergence of novel evidence types, verifying signatures across multi-cloud ledgers.',
      category: 'innovation',
      status: 'Defined',
      severity: 'Medium',
      auditProof: 'framework-definition-only — no live cryptographic seal exists for this rule',
      liveAssertions: [
        'Weights cryptographic proof higher than static code analysis metrics',
        'Lowers score impacts of historical, fully-mitigated minor vulnerabilities'
      ]
    }
  ];

  // Self-Evolving Architecture Modules
  const architectureModules = [
    {
      id: 'registry',
      name: 'Standards Registry',
      role: 'Stores all regulatory, policy, and compliance definitions.',
      dynamicStatus: 'Design blueprint only — not wired to a live standards feed',
      config: {
        activeChecklists: ['SOC2-CC', 'ISO-ISMS-A8', 'NIST-SSDF'],
        recheckInterval: '86400s',
        autoPullStandards: true
      }
    },
    {
      id: 'interpreter',
      name: 'Rule Interpreter',
      role: 'Executes mathematical policy checks dynamically against active software passports.',
      dynamicStatus: 'Design blueprint only — no rule interpreter engine is running yet',
      config: {
        engine: 'WASM Policy VM',
        sandboxIsolation: true,
        strictMode: true,
        timeoutMs: 50
      }
    },
    {
      id: 'update_engine',
      name: 'Dynamic Update Engine',
      role: 'Permits rule additions, calibrations, and hotfixes without system redeployment or downtime.',
      dynamicStatus: 'Design blueprint only — no live update mechanism exists yet',
      config: {
        rollingUpdates: true,
        consensusThreshold: '0.66',
        fallbackVersion: 'v4.12.0'
      }
    },
    {
      id: 'scoring',
      name: 'Truthfulness Scoring Engine',
      role: 'Computes deep dynamic trust and truthfulness scores using multi-party evidence chains.',
      dynamicStatus: 'Design blueprint only — no scoring engine computes this yet',
      config: {
        decayFactor: '0.985',
        decayIntervalDays: 30,
        unattestedPenalty: -15,
        signatureBonus: 5
      }
    },
    {
      id: 'violation',
      name: 'Violation Engine',
      role: 'Detects code drifts, package compromises, or signature mismatches instantly.',
      dynamicStatus: 'Design blueprint only — no violation detection engine is running yet',
      config: {
        haltDeployment: true,
        sirenWebhookEnabled: true,
        autoIsolationMode: 'Quarantine'
      }
    },
    {
      id: 'graph_engine',
      name: 'Trust Graph Engine',
      role: 'Assembles and maps directed acyclic relationship graphs of all software layers.',
      dynamicStatus: 'Design blueprint only — no graph engine has been built yet',
      config: {
        depthLevels: 12,
        bidirectionalProofs: true,
        graphFormat: 'GraphJSON-v2'
      }
    },
    {
      id: 'learning',
      name: 'Learning Engine',
      role: 'Parses security patterns, adapts rules dynamically, updates thresholds, and drives self-healing cycles.',
      dynamicStatus: 'Design blueprint only — no learning/self-calibration engine exists yet',
      config: {
        learningRate: '0.05',
        autoCalibrateThresholds: true,
        proposeNewRules: true,
        reinforcementGoal: 'Zero-False-Positives'
      }
    }
  ];

  // Filter Rules based on Active Domain and Live Search Query
  const filteredRules = rules.filter(rule => {
    const matchesCategory = rule.category === activeCategory;
    const matchesSearch = searchQuery === '' || 
                          rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          rule.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          rule.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const activeArchModuleData = architectureModules.find(m => m.id === activeArchModule) || architectureModules[0];
  const selectedDomainData = domains.find(d => d.id === activeCategory) || domains[0];

  return (
    <div className="space-y-6 text-left" id="trust-brain-view-container">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-100 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-slate-100 dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400">
              <Brain className="w-5 h-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold text-slate-800 dark:text-zinc-100 font-display">Trust Scoring Framework</h1>
              <p className="text-xs text-slate-500 dark:text-zinc-400 font-sans mt-0.5">
                Browse the governance rule taxonomy and trust-scoring metric definitions this platform is designed to evaluate against.
              </p>
            </div>
          </div>
        </div>

        {/* Framework status indicators — counts reflect defined items in this taxonomy, not live measurements */}
        <div className="flex flex-wrap gap-3">
          <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3 py-2 rounded-xl flex items-center gap-2">
            <Shield className="w-4.5 h-4.5 text-slate-400" />
            <div>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono font-bold block leading-none">RULES DEFINED</span>
              <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 font-mono">{rules.length} in taxonomy</span>
            </div>
          </div>

          <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 px-3 py-2 rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4.5 h-4.5 text-amber-500" />
            <div>
              <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-mono font-bold block leading-none">EVIDENCE SOURCE</span>
              <span className="text-xs font-bold text-slate-700 dark:text-zinc-300 font-mono">Not yet connected</span>
            </div>
          </div>
        </div>
      </div>

      {/* Top Banner Explainer */}
      <div className="bg-slate-900 dark:bg-zinc-900 text-slate-300 p-6 rounded-2xl border border-slate-800 dark:border-zinc-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shadow-lg">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-1.5 text-slate-400 font-mono text-xs font-bold">
            <Zap className="w-3.5 h-3.5" />
            <span>SPR TRUST FRAMEWORK — DESIGN BLUEPRINT</span>
          </div>
          <h2 className="text-base font-bold text-white font-display font-semibold">Toward a Self-Healing, Self-Correcting, Self-Evolving Trust Architecture</h2>
          <p className="text-xs text-slate-400 leading-relaxed font-sans">
            This page documents the target architecture and scoring taxonomy the Software Passport Registry is designed to grow into. The engines below (rule interpreter, scoring, violation detection, learning loop) are design blueprints, not running systems — none of them currently process live evidence.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <a
            href="#trust-explorer-anchor"
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-xs font-bold rounded-xl text-white transition-all shadow-md decoration-none text-center"
          >
            Explore Trust Hierarchy
          </a>
        </div>
      </div>

      {/* Interactive Architecture Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Module A: Interactive Self-Evolving Architecture Map (12 cols) */}
        <div className="lg:col-span-12 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-6 text-left">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Architecture Design Blueprint (Not Yet Live)</h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Click any engine component on the schematic diagram below to examine its internal configuration settings, operational rule bindings, and live loop outputs.
            </p>
          </div>

          {/* Graphical Map of Components */}
          <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-150 dark:border-zinc-800/80 p-6 rounded-xl relative overflow-hidden min-h-[300px] flex flex-col justify-center items-center">
            {/* Background grids */}
            <div className="absolute inset-0 opacity-5 dark:opacity-10" style={{ backgroundImage: 'radial-gradient(circle, #cbd5e1 1px, transparent 1px)', backgroundSize: '16px 16px' }} />

            {/* Schematic Nodes Structure */}
            <div className="relative w-full max-w-md grid grid-cols-3 gap-y-8 gap-x-4 text-center z-10">
              
              {/* Row 1 */}
              <div className="col-span-3 flex justify-center">
                <button
                  onClick={() => setActiveArchModule('registry')}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer ${
                    activeArchModule === 'registry' ? 'bg-indigo-600 text-white border-indigo-700 shadow-md' : 'bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:border-indigo-400 dark:hover:border-indigo-500'
                  }`}
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span>Standards Registry</span>
                </button>
              </div>

              {/* Connecting indicators */}
              <div className="col-span-3 flex justify-around text-slate-300 dark:text-zinc-700 h-2 -my-5 font-bold select-none">
                <span>|</span>
                <span>|</span>
              </div>

              {/* Row 2 */}
              <button
                onClick={() => setActiveArchModule('interpreter')}
                className={`p-2.5 rounded-xl text-[11px] font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  activeArchModule === 'interpreter' ? 'bg-indigo-600 text-white border-indigo-700 shadow-md' : 'bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:border-indigo-400 dark:hover:border-indigo-500'
                }`}
              >
                <Cpu className="w-4 h-4" />
                <span>Rule Interpreter</span>
              </button>

              <button
                onClick={() => setActiveArchModule('update_engine')}
                className={`p-2.5 rounded-xl text-[11px] font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  activeArchModule === 'update_engine' ? 'bg-indigo-600 text-white border-indigo-700 shadow-md' : 'bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:border-indigo-400 dark:hover:border-indigo-500'
                }`}
              >
                <RefreshCw className="w-4 h-4" />
                <span>Update Engine</span>
              </button>

              <button
                onClick={() => setActiveArchModule('scoring')}
                className={`p-2.5 rounded-xl text-[11px] font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  activeArchModule === 'scoring' ? 'bg-indigo-600 text-white border-indigo-700 shadow-md' : 'bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:border-indigo-400 dark:hover:border-indigo-500'
                }`}
              >
                <TrendingUp className="w-4 h-4" />
                <span>Scoring Engine</span>
              </button>

              {/* Connecting indicators */}
              <div className="col-span-3 flex justify-around text-slate-300 dark:text-zinc-700 h-2 -my-5 font-bold select-none">
                <span>|</span>
                <span>|</span>
              </div>

              {/* Row 3 */}
              <button
                onClick={() => setActiveArchModule('violation')}
                className={`p-2.5 rounded-xl text-[11px] font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  activeArchModule === 'violation' ? 'bg-indigo-600 text-white border-indigo-700 shadow-md' : 'bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:border-indigo-400 dark:hover:border-indigo-500'
                }`}
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Violation Engine</span>
              </button>

              <button
                onClick={() => setActiveArchModule('graph_engine')}
                className={`p-2.5 rounded-xl text-[11px] font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  activeArchModule === 'graph_engine' ? 'bg-indigo-600 text-white border-indigo-700 shadow-md' : 'bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:border-indigo-400 dark:hover:border-indigo-500'
                }`}
              >
                <GitBranch className="w-4 h-4" />
                <span>Trust Graph</span>
              </button>

              <button
                onClick={() => setActiveArchModule('learning')}
                className={`p-2.5 rounded-xl text-[11px] font-bold border transition-all flex flex-col items-center gap-1 cursor-pointer ${
                  activeArchModule === 'learning' ? 'bg-indigo-600 text-white border-indigo-700 shadow-md animate-pulse' : 'bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-300 border-slate-200 dark:border-zinc-800 hover:border-indigo-400 dark:hover:border-indigo-500'
                }`}
              >
                <Brain className="w-4 h-4 text-emerald-500" />
                <span>Learning Engine</span>
              </button>

            </div>
          </div>

          {/* Component Info Card and config */}
          <div className="bg-slate-900 dark:bg-zinc-950 text-slate-200 p-4.5 rounded-xl border border-slate-800 dark:border-zinc-800/80 space-y-3.5">
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Sliders className="w-4 h-4 text-indigo-400" />
                <h4 className="text-xs font-bold text-white font-mono uppercase">{activeArchModuleData.name} Settings</h4>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 font-bold bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                ACTIVE STATE
              </span>
            </div>

            <div className="space-y-1">
              <p className="text-[11px] text-slate-400 font-sans leading-relaxed">{activeArchModuleData.role}</p>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-300 font-semibold mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                <span>{activeArchModuleData.dynamicStatus}</span>
              </div>
            </div>

            {/* Code config inspector block */}
            <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-[10px] text-indigo-300 space-y-1 overflow-x-auto max-h-[140px]">
              <span className="text-slate-500 block"># runtime_parameters.yaml</span>
              {Object.entries(activeArchModuleData.config).map(([key, val]) => (
                <div key={key}>
                  <span className="text-indigo-400">{key}:</span>{' '}
                  <span className="text-amber-400">{JSON.stringify(val)}</span>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Global Hierarchical Trust Explorer Container */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6" id="trust-explorer-anchor">
        
        {/* Explorer Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 dark:border-zinc-800 pb-5">
          <div className="space-y-1 text-left">
            <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 font-display flex items-center gap-1.5">
              <BookOpen className="w-4.5 h-4.5 text-indigo-500" />
              <span>Global Hierarchical Trust Explorer</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-zinc-400">
              Navigate through SPR's 16 baseline trust domains and exclusive innovation metrics. Inspect cryptographic proofs, adjust weights, and review co-signed security rules.
            </p>
          </div>

          {/* Live Search bar */}
          <div className="relative w-full md:w-80 shrink-0">
            <input
              type="text"
              placeholder="Search specific rule or metric properties..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Hierarchical Two-Panel Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Panel: 17 Domains List (4 cols) */}
          <div className="lg:col-span-4 bg-slate-50 dark:bg-zinc-950 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-4 space-y-2.5">
            <div className="px-2 pb-1 border-b border-slate-200/60 dark:border-zinc-800/50">
              <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 block uppercase tracking-wider">
                17 Trust Categories
              </span>
            </div>
            
            <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
              {domains.map(dom => {
                const isActive = activeCategory === dom.id;
                
                // Score color styling
                let scoreColor = 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/50';
                if (dom.overallScore < 75) scoreColor = 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border-rose-100 dark:border-rose-900/50';
                else if (dom.overallScore < 90) scoreColor = 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/20 border-amber-100 dark:border-amber-900/50';

                return (
                  <button
                    key={dom.id}
                    onClick={() => {
                      setActiveCategory(dom.id);
                    }}
                    className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isActive 
                        ? 'bg-indigo-600 border-indigo-700 text-white shadow-md' 
                        : 'bg-white dark:bg-zinc-900 border-slate-150 dark:border-zinc-800 hover:bg-slate-100/50 dark:hover:bg-zinc-800/50 text-slate-700 dark:text-zinc-300 hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-lg leading-none shrink-0">{dom.emoji}</span>
                      <div className="text-left">
                        <span className={`text-xs font-bold block leading-tight ${isActive ? 'text-white' : 'text-slate-800 dark:text-zinc-200'}`}>
                          {dom.name}
                        </span>
                        <span className={`text-[10px] block mt-0.5 ${isActive ? 'text-indigo-200' : 'text-slate-400 dark:text-zinc-500'}`}>
                          {dom.metrics.length} distinct metrics
                        </span>
                      </div>
                    </div>
                    
                    <span className={`px-2 py-0.5 rounded-lg text-xs font-mono font-bold border shrink-0 ${
                      isActive ? 'bg-white/15 text-white border-white/20' : scoreColor
                    }`} title="Framework target — not a live measurement">
                      {dom.overallScore}% target
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Panel: Selected Domain Detail (8 cols) */}
          <div className="lg:col-span-8 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 space-y-6">
            
            {/* Domain Overview Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 dark:border-zinc-800 pb-5">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="text-2xl leading-none">{selectedDomainData.emoji}</span>
                  <h3 className="text-base font-bold text-slate-800 dark:text-zinc-100 font-display">
                    {selectedDomainData.name} Detail
                  </h3>
                </div>
                <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed max-w-xl font-sans">
                  {selectedDomainData.description}
                </p>
              </div>
              
              {/* Framework Target Score Card — static reference figure, not a live measurement */}
              <div className="bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 p-4 rounded-2xl flex items-center gap-4.5 shrink-0 sm:w-52 text-left">
                <div className="relative flex items-center justify-center">
                  <div className="w-14 h-14 rounded-full border-4 border-slate-200 dark:border-zinc-800 flex items-center justify-center relative">
                    <span className="text-xs font-mono font-bold text-slate-800 dark:text-zinc-200">
                      {selectedDomainData.overallScore}%
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold text-slate-400 dark:text-zinc-500 uppercase block">DOMAIN TARGET</span>
                  <span className="text-[11px] font-bold text-slate-700 dark:text-zinc-300 block mt-0.5">
                    Not yet measured
                  </span>
                  <span className="text-[9px] text-slate-400 dark:text-zinc-500 block font-mono mt-0.5">Reference figure only</span>
                </div>
              </div>
            </div>

            {/* Sub-Metrics Subsection */}
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-2">
                <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-mono">
                  Trust Scoring Framework — Metric Definitions ({selectedDomainData.metrics.length})
                </h4>
                <span className="text-[10px] font-mono text-indigo-500 dark:text-indigo-400 font-semibold">
                  Role: {isAdmin ? 'Administrator (Write Access)' : 'Auditor (Read-Only)'}
                </span>
              </div>

              <div className="space-y-3.5 max-h-[460px] overflow-y-auto pr-1">
                {selectedDomainData.metrics.map(metric => {
                  const totalWeight = selectedDomainData.metrics.reduce((acc, m) => acc + m.weight, 0);
                  const contributionPct = totalWeight > 0 ? Math.round((metric.weight / totalWeight) * 100) : 0;

                  return (
                    <div key={metric.id} className="bg-slate-50 dark:bg-zinc-950/40 hover:bg-slate-100/30 dark:hover:bg-zinc-950/70 border border-slate-150 dark:border-zinc-800/60 p-4 rounded-xl transition-all space-y-3 text-left">
                      
                      {/* Metric Name and Meta */}
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 font-sans block">
                            {metric.name}
                          </span>
                          <p className="text-[11px] text-slate-500 dark:text-zinc-400 font-sans leading-relaxed">
                            {metric.description}
                          </p>
                        </div>

                        <div className="flex flex-col items-end gap-1.5 shrink-0">
                          <div className="flex items-center gap-1.5">
                            <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold border ${
                              metric.status === 'Calibrating' ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-400 border-amber-100 dark:border-amber-900/50' :
                              metric.status === 'Unverified' ? 'bg-slate-100 dark:bg-zinc-900 text-slate-500 dark:text-zinc-400 border-slate-200 dark:border-zinc-700' :
                              'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border-rose-100 dark:border-rose-900/50'
                            }`}>
                              {metric.status}
                            </span>
                            <span className="text-xs font-mono font-bold text-slate-400 dark:text-zinc-500" title="Reference target value — not a live measurement">
                              {metric.score}% target
                            </span>
                          </div>
                          <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-mono">
                            Weight Contribution: {contributionPct}%
                          </span>
                        </div>
                      </div>

                      {/* Weight Calibration Slider */}
                      <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800/80 p-3 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500 shrink-0" />
                          <span className="text-[10px] font-mono text-slate-500 dark:text-zinc-400 uppercase tracking-wide">
                            Calibration Weight: <strong className="text-indigo-600 dark:text-indigo-400">{metric.weight} / 100</strong>
                          </span>
                        </div>

                        <div className="flex items-center gap-3 flex-1 max-w-xs justify-end">
                          <input
                            type="range"
                            min="0"
                            max="100"
                            value={metric.weight}
                            onChange={(e) => updateMetricWeight(selectedDomainData.id, metric.id, parseInt(e.target.value))}
                            disabled={!isAdmin}
                            className={`w-full h-1 bg-slate-200 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 ${
                              !isAdmin ? 'opacity-50 cursor-not-allowed' : 'cursor-ew-resize'
                            }`}
                          />
                          {!isAdmin && (
                            <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-mono flex items-center gap-1 whitespace-nowrap">
                              <Lock className="w-3 h-3" />
                              <span>Locked</span>
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Framework reference line — not a live evidence log */}
                      <div className="flex items-center gap-2 bg-slate-900 dark:bg-zinc-950 p-2.5 rounded-lg text-slate-300 dark:text-zinc-400 font-mono text-[10px] leading-none overflow-x-auto border border-slate-800 dark:border-zinc-800">
                        <span className="text-slate-500 dark:text-zinc-600 uppercase text-[9px] font-bold">Evidence:</span>
                        <span className="text-slate-400 select-all">{metric.evidence}</span>
                      </div>

                    </div>
                  );
                })}
              </div>
            </div>

            {/* Programmatic Rules Linkage Section */}
            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-zinc-800">
              <h4 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider font-mono">
                Governance Rule Definitions ({filteredRules.length})
              </h4>

              {filteredRules.length === 0 ? (
                <p className="text-xs text-slate-400 italic bg-slate-50 dark:bg-zinc-950/20 p-4 border border-slate-150 dark:border-zinc-800 border-dashed rounded-xl">
                  No rule definitions are currently mapped to this domain index.
                </p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredRules.map(rule => (
                    <div
                      key={rule.id}
                      onClick={() => setSelectedRule(rule)}
                      className="bg-slate-50 dark:bg-zinc-950 hover:bg-slate-100/50 dark:hover:bg-zinc-900/50 border border-slate-150 dark:border-zinc-850 rounded-xl p-4 cursor-pointer transition-all flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-[9px] font-mono text-slate-400 dark:text-zinc-500 font-bold uppercase">{rule.id}</span>
                          <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold bg-slate-500 text-white">
                            {rule.status}
                          </span>
                        </div>
                        <h5 className="text-xs font-bold text-slate-800 dark:text-zinc-200 leading-tight">
                          {rule.name}
                        </h5>
                        <p className="text-[11px] text-slate-500 dark:text-zinc-400 line-clamp-2">
                          {rule.description}
                        </p>
                      </div>
                      <div className="border-t border-slate-200/50 dark:border-zinc-800/80 pt-2.5 mt-3 flex justify-between items-center text-[9px] font-mono text-slate-400 dark:text-zinc-500">
                        <span>SEVERITY: <strong className={rule.severity === 'Critical' ? 'text-rose-600' : 'text-amber-600'}>{rule.severity}</strong></span>
                        <span className="text-indigo-600 dark:text-indigo-400 font-bold flex items-center gap-0.5">
                          <span>Inspect</span>
                          <ChevronRight className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

      {/* Slide detail modal drawer for Inspecting Rules */}
      {selectedRule && (
        <div className="fixed inset-0 z-50 overflow-hidden flex justify-end bg-slate-900/40 dark:bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white dark:bg-zinc-900 h-full shadow-2xl flex flex-col justify-between border-l border-slate-200 dark:border-zinc-800 animate-in slide-in-from-right duration-200">
            
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 dark:border-zinc-800 space-y-2 text-left">
              <button
                onClick={() => setSelectedRule(null)}
                className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-850 rounded-full cursor-pointer transition-colors"
              >
                <span className="text-xl font-bold font-mono">×</span>
              </button>
              
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 px-2.5 py-0.5 rounded border border-indigo-100 dark:border-indigo-900/50">
                  {selectedRule.category.toUpperCase()} Rule
                </span>
                <span className="text-[10px] font-mono text-slate-400 dark:text-zinc-500">
                  {selectedRule.id}
                </span>
              </div>
              
              <h2 className="text-base font-bold text-slate-900 dark:text-zinc-100 font-display pr-8">{selectedRule.name}</h2>
              <div className="text-[11px] text-slate-400 dark:text-zinc-500 font-mono flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-slate-400 dark:text-zinc-500" />
                <span>Status: <strong className="text-slate-500 dark:text-zinc-400">{selectedRule.status}</strong></span>
              </div>
            </div>

            {/* Modal Body / Rule details */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-left">
              <div className="space-y-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-mono">Rule Description & Intention</h3>
                <p className="text-xs text-slate-600 dark:text-zinc-400 leading-relaxed font-sans bg-slate-50 dark:bg-zinc-950 border border-slate-150 dark:border-zinc-800 p-4 rounded-xl">
                  {selectedRule.description}
                </p>
              </div>

              {/* Rule requirement list — a definition of intended behavior, not a log of live runtime events */}
              <div className="space-y-3.5 pt-4 border-t border-slate-100 dark:border-zinc-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-mono">Rule Requirements (Framework Definition)</h3>
                <div className="space-y-2">
                  {selectedRule.liveAssertions.map((assertion, index) => (
                    <div key={index} className="flex items-start gap-2 text-xs text-slate-600 dark:text-zinc-300 bg-white dark:bg-zinc-950 border border-slate-150 dark:border-zinc-850 p-3 rounded-lg">
                      <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <span className="font-medium font-sans leading-relaxed">{assertion}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Framework Reference Block — explicitly not a cryptographic proof */}
              <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-zinc-800">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-zinc-500 font-mono">Rule Reference</h3>
                <div className="bg-slate-900 dark:bg-zinc-950 border border-slate-800 dark:border-zinc-850 p-4 rounded-xl space-y-3">
                  <div className="flex justify-between items-center text-[10px] font-mono text-indigo-400 font-bold">
                    <span>REFERENCE ID</span>
                    <span className="text-slate-400">NOT A LIVE ATTESTATION</span>
                  </div>
                  <div className="text-[11px] font-mono text-slate-300 dark:text-zinc-400 break-all bg-slate-950 dark:bg-zinc-900 p-3 rounded border border-slate-800/60 leading-relaxed">
                    {selectedRule.auditProof}
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-sans leading-normal">
                    This rule is currently a framework definition only. No cryptographic ledger, signature, or enforcement engine backs it yet — nothing here should be read as a verified or immutable record.
                  </p>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-6 border-t border-slate-100 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/20 flex justify-end">
              <button
                onClick={() => setSelectedRule(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-white font-sans font-bold text-xs rounded-xl transition-all cursor-pointer shadow"
              >
                Close Rule Inspector
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
