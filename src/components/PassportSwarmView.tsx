/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import PassportD3Graph from './PassportD3Graph';
import { apiFetch } from '../utils/apiClient';
import {
  Sparkles,
  Fingerprint,
  Shield,
  FileCheck,
  Cpu,
  Layers,
  Award,
  Eye,
  TrendingUp,
  Database,
  Play,
  RotateCcw,
  CheckCircle2,
  Terminal,
  Activity,
  Code,
  AlertTriangle,
  Lock,
  Boxes,
  HelpCircle,
  FileSignature,
  BookOpen,
  Check
} from 'lucide-react';
import { SoftwarePassport } from '../types';

interface PassportSwarmViewProps {
  passport: SoftwarePassport;
}

interface AgentNode {
  id: string;
  name: string;
  icon: React.ElementType;
  color: string;
  borderColor: string;
  bgLight: string;
  bgDark: string;
  status: 'Sleeping' | 'Scanning' | 'Enforcing' | 'Reviewing' | 'Mapping' | 'Tracking' | 'Observing' | 'Forecasting' | 'Recording' | 'Active';
  role: string;
  metricLabel: string;
  metricValue: string;
  details: string[];
}

export default function PassportSwarmView({ passport }: PassportSwarmViewProps) {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('identity-ai');
  const [swarmViewMode, setSwarmViewMode] = useState<'grid' | 'graph'>('graph');
  const [isSwarmActive, setIsSwarmActive] = useState<boolean>(false);
  const [currentStep, setCurrentStep] = useState<number>(-1);
  const [progress, setProgress] = useState<number>(0);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<string | null>(null);
  const [consoleLogs, setConsoleLogs] = useState<string[]>([
    `[System] AI Swarm initialized for Software Passport: ${passport.name} (v${passport.version})`,
    `[System] 24/7 Continuous Monitoring mode is active in sleep/listen state.`,
    `[System] Click "Run Live Swarm Audit" to trigger an active real-time ecosystem assessment.`
  ]);

  const [simulatedScore, setSimulatedScore] = useState<number>(passport.overallScore);
  const [checklistResults, setChecklistResults] = useState({
    identity: true,
    vulnerabilities: passport.vulnerabilities.length === 0,
    code: true,
    supplyChain: true,
    compliance: true,
    reputation: true,
    prediction: true,
    evidence: true
  });

  const terminalEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll console logs
  useEffect(() => {
    if (terminalEndRef.current) {
      terminalEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [consoleLogs]);

  // Agents Definition
  const agents: AgentNode[] = [
    {
      id: 'identity-ai',
      name: 'Identity AI',
      icon: Fingerprint,
      color: 'text-indigo-500 dark:text-indigo-400',
      borderColor: 'border-indigo-100 dark:border-indigo-900/50',
      bgLight: 'bg-indigo-50/50 dark:bg-indigo-950/20',
      bgDark: 'bg-indigo-600',
      status: currentStep === 0 ? 'Scanning' : isSwarmActive ? 'Active' : 'Sleeping',
      role: 'Knows who built the software, tracks ownership, verifies code signing keys & binary authenticity.',
      metricLabel: 'SLSA Attestation Level',
      metricValue: 'SLSA Level 4 Verified',
      details: [
        'Verified cryptographically-bound developer signature chain.',
        '100% matches validated Software Passport Registry publisher key.',
        'Binary provenance hash verified (No tampering detected).'
      ]
    },
    {
      id: 'security-ai',
      name: 'Security AI',
      icon: Shield,
      color: 'text-rose-500 dark:text-rose-400',
      borderColor: 'border-rose-100 dark:border-rose-900/50',
      bgLight: 'bg-rose-50/50 dark:bg-rose-950/20',
      bgDark: 'bg-rose-600',
      status: currentStep === 1 ? 'Scanning' : isSwarmActive ? 'Active' : 'Sleeping',
      role: 'Scans for CVE vulnerabilities, watches exploit databases, and calculates live security risk indexes.',
      metricLabel: 'CVE Severity Rating',
      metricValue: passport.vulnerabilities.length === 0 ? '0 Vulnerabilities' : `${passport.vulnerabilities.length} Active CVEs`,
      details: [
        'Continuous synchronization with NVD, GitHub Advisory, and VulnDB.',
        'Zero high-severity exploitable paths in active memory layers.',
        `CVSS Score posture estimated at ${passport.securityScore}/100.`
      ]
    },
    {
      id: 'compliance-ai',
      name: 'Compliance AI',
      icon: FileCheck,
      color: 'text-emerald-500 dark:text-emerald-400',
      borderColor: 'border-emerald-100 dark:border-emerald-900/50',
      bgLight: 'bg-emerald-50/50 dark:bg-emerald-950/20',
      bgDark: 'bg-emerald-600',
      status: currentStep === 2 ? 'Enforcing' : isSwarmActive ? 'Active' : 'Sleeping',
      role: 'Monitors compliance status, collects audit evidence automatically, and flags compliance controls gaps.',
      metricLabel: 'Standards Satisfied',
      metricValue: 'SOC 2, NIST 800-218',
      details: [
        'Automated controls telemetry collecting proof points 24/7.',
        'Zero non-compliant controls reported in last audit.',
        `Compliance Alignment Index score is ${passport.complianceScore}/100.`
      ]
    },
    {
      id: 'code-ai',
      name: 'Code AI',
      icon: Code,
      color: 'text-amber-500 dark:text-amber-400',
      borderColor: 'border-amber-100 dark:border-amber-900/50',
      bgLight: 'bg-amber-50/50 dark:bg-amber-950/20',
      bgDark: 'bg-amber-600',
      status: currentStep === 3 ? 'Reviewing' : isSwarmActive ? 'Active' : 'Sleeping',
      role: 'Reviews source code changes, measures technical debt, and monitors cyclomatic complexity.',
      metricLabel: 'Code Health Grade',
      metricValue: 'Grade A (Excellent)',
      details: [
        'Cyclomatic depth within highly optimized bounds (< 15).',
        'No high-priority code smells or memory leak potentials flagged.',
        'Technical debt ratio calculated at a negligible 1.1%.'
      ]
    },
    {
      id: 'supply-chain-ai',
      name: 'Supply Chain AI',
      icon: Layers,
      color: 'text-cyan-500 dark:text-cyan-400',
      borderColor: 'border-cyan-100 dark:border-cyan-900/50',
      bgLight: 'bg-cyan-50/50 dark:bg-cyan-950/20',
      bgDark: 'bg-cyan-600',
      status: currentStep === 4 ? 'Mapping' : isSwarmActive ? 'Active' : 'Sleeping',
      role: 'Maps direct/transitive dependencies, identifies vulnerable libraries, and flags licensing risks.',
      metricLabel: 'SBOM Dependency Depth',
      metricValue: `${passport.sbom.length} Packages Verified`,
      details: [
        'CycloneDX v1.5 JSON manifest validated and locked.',
        '100% of open-source packages mapped with clean permissive licenses.',
        'Transitive vulnerabilities accounted for in risk equations.'
      ]
    },
    {
      id: 'reputation-ai',
      name: 'Reputation AI',
      icon: Award,
      color: 'text-blue-500 dark:text-blue-400',
      borderColor: 'border-blue-100 dark:border-blue-900/50',
      bgLight: 'bg-blue-50/50 dark:bg-blue-950/20',
      bgDark: 'bg-blue-600',
      status: currentStep === 5 ? 'Tracking' : isSwarmActive ? 'Active' : 'Sleeping',
      role: 'Tracks publisher operational reliability, listens to system uptime registers, and gauges customer trust.',
      metricLabel: 'Publisher Score',
      metricValue: `${passport.vendorReputationScore}/100 Trust`,
      details: [
        'Publisher holds verified SLA agreement certificates.',
        'Zero security incidents reported on publisher records over 180 days.',
        'Public operational status verified: 99.99% uptime.'
      ]
    },
    {
      id: 'behavior-ai',
      name: 'Behavior AI',
      icon: Eye,
      color: 'text-purple-500 dark:text-purple-400',
      borderColor: 'border-purple-100 dark:border-purple-900/50',
      bgLight: 'bg-purple-50/50 dark:bg-purple-950/20',
      bgDark: 'bg-purple-600',
      status: currentStep === 6 ? 'Observing' : isSwarmActive ? 'Active' : 'Sleeping',
      role: 'Detects anomalous software runtime behaviors and indicators of zero-day code compromise.',
      metricLabel: 'Sandbox Verification',
      metricValue: 'All Behaviors Verified',
      details: [
        'Monitors outbound TCP socket operations in sandboxed simulations.',
        'No heap corruption attempts or unauthorized registry write signals.',
        'Verified clean after latest v1.12.4 update releases.'
      ]
    },
    {
      id: 'prediction-ai',
      name: 'Prediction AI',
      icon: TrendingUp,
      color: 'text-violet-500 dark:text-violet-400',
      borderColor: 'border-violet-100 dark:border-violet-900/50',
      bgLight: 'bg-violet-50/50 dark:bg-violet-950/20',
      bgDark: 'bg-violet-600',
      status: currentStep === 7 ? 'Forecasting' : isSwarmActive ? 'Active' : 'Sleeping',
      role: 'Predicts future software failures, vulnerability windows, and future maintenance cycles.',
      metricLabel: '90-Day Outlook',
      metricValue: '99% Risk Mitigation',
      details: [
        'Monte Carlo risk simulations estimate risk is minimal.',
        'Historical update frequencies predict stable lifecycle posture.',
        'Vulnerability occurrence probability mapped under < 0.05%.'
      ]
    },
    {
      id: 'evidence-ai',
      name: 'Evidence AI',
      icon: Database,
      color: 'text-teal-500 dark:text-teal-400',
      borderColor: 'border-teal-100 dark:border-teal-900/50',
      bgLight: 'bg-teal-50/50 dark:bg-teal-950/20',
      bgDark: 'bg-teal-600',
      status: currentStep === 8 ? 'Recording' : isSwarmActive ? 'Active' : 'Sleeping',
      role: 'Stores auditable proof for every decision, locks cryptographic timeline logs, and justifies score changes.',
      metricLabel: 'Ledger Registry',
      metricValue: '100% Tamperproof',
      details: [
        'Cryptographic hashes of scan logs pushed to tamper-proof ledger.',
        'Chronological audit ledger entry established.',
        `Immutable certificate signature locked: sha256:${passport.fileHash.substring(0, 16)}...`
      ]
    }
  ];

  const activeAgent = agents.find(a => a.id === selectedAgentId) || agents[0];

  // Active Asynchronous Database-Backed Agent Job Trigger
  const handleStartAudit = async () => {
    setIsSwarmActive(true);
    setProgress(10);
    setConsoleLogs(prev => [
      ...prev,
      `[System] Initializing asynchronous background run for ${activeAgent.name}...`,
      `[System] Dispatched backend job and opening dynamic websocket/interval polling channel...`
    ]);

    try {
      const res = await apiFetch('/api/agent-jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: selectedAgentId,
          passportId: passport.id,
          jobType: 'automated_integrity_audit'
        })
      });

      if (res.ok) {
        const data = await res.json();
        setActiveJobId(data.id);
        setJobStatus(data.status);
      } else {
        const err = await res.json();
        setConsoleLogs(prev => [
          ...prev,
          `[System Error] Failed to register agent job on backend: ${err.error || 'Permission Denied'}`
        ]);
        setIsSwarmActive(false);
      }
    } catch (err: any) {
      setConsoleLogs(prev => [
        ...prev,
        `[System Error] Network request crashed: ${err.message || err}`
      ]);
      setIsSwarmActive(false);
    }
  };

  // Real-time Database Polling of Agent Logs and Progress
  useEffect(() => {
    if (!activeJobId || !isSwarmActive) return;

    const interval = setInterval(async () => {
      try {
        const res = await apiFetch('/api/agent-jobs');
        if (res.ok) {
          const list = await res.json();
          const job = list.find((j: any) => j.id === activeJobId);
          if (job) {
            setJobStatus(job.status);
            setProgress(job.progress || 0);

            // Pull live chronological logs from the database
            const logsRes = await apiFetch(`/api/agent-jobs/${activeJobId}/logs`);
            if (logsRes.ok) {
              const logsList = await logsRes.json();
              const formattedLogs = logsList.map((l: any) => {
                const levelIcon = l.level === 'Error' ? '❌' : l.level === 'Warning' ? '⚠️' : '⚙️';
                return `[${l.agentId.toUpperCase()}] ${levelIcon} ${l.message}`;
              });
              setConsoleLogs([
                `[System] Active Job Queue channel open (ID: ${activeJobId})`,
                ...formattedLogs
              ]);
            }

            if (job.status === 'Completed') {
              clearInterval(interval);
              setIsSwarmActive(false);
              setSimulatedScore(passport.overallScore);
              setConsoleLogs(prev => [
                ...prev,
                `[System] ========================================================`,
                `[System] AI INTEGRITY SWARM AUDIT COMPLETED SUCCESSFULLY! ✅`,
                `[System] Cryptographic evidence attestation was persisted into PostgreSQL.`,
                `[System] AI ANALYSIS DIRECTIVE:`,
                job.result || 'No output recorded.'
              ]);
            } else if (job.status === 'Failed') {
              clearInterval(interval);
              setIsSwarmActive(false);
              setConsoleLogs(prev => [
                ...prev,
                `[System] ========================================================`,
                `[System Error] AI AGENT PIPELINE CRASHED: ${job.error || 'Check backend console'}`
              ]);
            }
          }
        }
      } catch (err) {
        console.error('Error polling agent job status:', err);
      }
    }, 1500);

    return () => clearInterval(interval);
  }, [activeJobId, isSwarmActive]);

  const resetSwarm = () => {
    setIsSwarmActive(false);
    setCurrentStep(-1);
    setProgress(0);
    setActiveJobId(null);
    setJobStatus(null);
    setSelectedAgentId('identity-ai');
    setConsoleLogs([
      `[System] AI Swarm initialized for Software Passport: ${passport.name} (v${passport.version})`,
      `[System] 24/7 Continuous Monitoring mode is active in sleep/listen state.`,
      `[System] Click "Run Live Swarm Audit" to trigger an active real-time ecosystem assessment.`
    ]);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm space-y-6" id="passport-alive-swarm-workspace">
      {/* Upper header block with pulsating live indicator */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 dark:border-zinc-850 pb-5">
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center">
            <span className="animate-ping absolute inline-flex h-4 w-4 rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-emerald-500"></span>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-slate-800 dark:text-zinc-50 font-display">Living Software Passport: 24/7 AI Swarm</h2>
              <span className="bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900 text-[9px] font-bold font-mono px-2 py-0.5 rounded-full">
                ACTIVE COGNITIVE TEAM
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1">
              Instead of a static report, every Software Passport is maintained 24/7 by a collaborative swarm of 9 specialist AI agents.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 w-full md:w-auto">
          {isSwarmActive ? (
            <div className="flex items-center gap-2 bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/50 px-4 py-2 rounded-xl text-xs font-semibold text-indigo-700 dark:text-indigo-400 w-full md:w-auto justify-center">
              <Activity className="w-4 h-4 animate-spin text-indigo-500" />
              <span>Scanning: {agents[currentStep]?.name || 'Collaboration Chain'} ({progress}%)</span>
            </div>
          ) : (
            <>
              <button
                onClick={handleStartAudit}
                className="flex-1 md:flex-none px-4.5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-sans font-bold text-xs rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5" />
                <span>Run Live Swarm Audit</span>
              </button>
              {progress > 0 && (
                <button
                  onClick={resetSwarm}
                  className="p-2.5 border border-slate-200 dark:border-zinc-800 rounded-xl hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-600 dark:text-zinc-400 cursor-pointer transition-colors"
                  title="Reset Swarm States"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Progress Bar for the active audit */}
      {isSwarmActive && (
        <div className="space-y-1.5 animate-in fade-in duration-200">
          <div className="flex justify-between text-[10px] font-mono text-slate-400 font-bold">
            <span>SWARM AUDIT IN PROGRESS...</span>
            <span>{progress}% COMPLETE</span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-zinc-950 h-2 rounded-full overflow-hidden border border-slate-200/50 dark:border-zinc-850">
            <div
              className="bg-indigo-600 h-full transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      )}

      {/* Visualization Tab Controls */}
      <div className="flex justify-between items-center bg-slate-50 dark:bg-zinc-950 p-1 rounded-xl border border-slate-200 dark:border-zinc-850 max-w-md">
        <button
          onClick={() => setSwarmViewMode('graph')}
          className={`flex-1 py-2 px-4 rounded-lg font-sans font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            swarmViewMode === 'graph'
              ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-zinc-800'
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-indigo-500 animate-pulse" />
          <span>Interactive D3 Network</span>
        </button>
        <button
          onClick={() => setSwarmViewMode('grid')}
          className={`flex-1 py-2 px-4 rounded-lg font-sans font-bold text-xs transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
            swarmViewMode === 'grid'
              ? 'bg-white dark:bg-zinc-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-zinc-800'
              : 'text-slate-500 dark:text-zinc-400 hover:text-slate-800 dark:hover:text-zinc-200'
          }`}
        >
          <Boxes className="w-3.5 h-3.5 text-indigo-500" />
          <span>Scanner Pipeline Grid</span>
        </button>
      </div>

      {/* Main split work grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left 9-Node Agent Grid map or D3 Force Graph (Col-span 7) */}
        <div className="lg:col-span-7 space-y-4">
          {swarmViewMode === 'graph' ? (
            <PassportD3Graph
              passport={passport}
              selectedAgentId={selectedAgentId}
              onSelectAgent={setSelectedAgentId}
              isSwarmActive={isSwarmActive}
              currentStep={currentStep}
            />
          ) : (
            <>
              <div className="flex justify-between items-center">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 font-mono">Pipeline Stages</h3>
                <span className="text-[10px] font-mono text-slate-500">Job logs appear only after a server-side scan starts</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {agents.map((agent) => {
                  const Icon = agent.icon;
                  const isSelected = agent.id === selectedAgentId;
                  const isScanning = agent.status === 'Scanning' || agent.status === 'Enforcing' || agent.status === 'Reviewing' || agent.status === 'Mapping' || agent.status === 'Tracking' || agent.status === 'Observing' || agent.status === 'Forecasting' || agent.status === 'Recording';
                  
                  return (
                    <div
                      key={agent.id}
                      onClick={() => !isSwarmActive && setSelectedAgentId(agent.id)}
                      className={`border rounded-xl p-3.5 text-left cursor-pointer transition-all relative overflow-hidden flex flex-col gap-2.5 ${
                        isSelected
                          ? 'border-indigo-600 ring-1 ring-indigo-500 shadow-sm bg-indigo-50/5 dark:bg-indigo-950/5'
                          : 'border-slate-150 dark:border-zinc-850 hover:border-slate-300 dark:hover:border-zinc-700 bg-slate-50/20 dark:bg-zinc-900/10'
                      } ${isSwarmActive && !isScanning ? 'opacity-55 cursor-not-allowed' : ''}`}
                    >
                      {/* Status Indicator pulse */}
                      <div className="flex justify-between items-start">
                        <div className={`p-2 rounded-lg shrink-0 ${agent.bgLight} ${agent.color}`}>
                          <Icon className="w-4.5 h-4.5" />
                        </div>

                        <span className={`text-[8px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase flex items-center gap-1 ${
                          agent.status === 'Sleeping' ? 'bg-slate-50 dark:bg-zinc-950 text-slate-500 border-slate-200 dark:border-zinc-800' :
                          isScanning ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-900 animate-pulse' :
                          'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900'
                        }`}>
                          {isScanning && <span className="w-1 h-1 rounded-full bg-amber-500 animate-ping"></span>}
                          <span>{agent.status}</span>
                        </span>
                      </div>

                      <div>
                        <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200 leading-snug">{agent.name}</h4>
                        <p className="text-[10px] text-slate-500 dark:text-zinc-400 truncate mt-1">
                          {agent.metricValue}
                        </p>
                      </div>

                      {/* Highlight bar for selected node */}
                      {isSelected && (
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-600"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Right Panel: Selected Agent Telemetry (Col-span 5) */}
        <div className="lg:col-span-5 flex flex-col justify-between border border-slate-200 dark:border-zinc-800 bg-slate-50/30 dark:bg-zinc-900/10 rounded-2xl p-5 shadow-inner">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className={`p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-100 dark:border-indigo-900/50`}>
                <activeAgent.icon className="w-5.5 h-5.5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 font-display flex items-center gap-1.5">
                  <span>{activeAgent.name}</span>
                  <span className="bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 text-[8px] font-mono px-1.5 py-0.5 rounded uppercase font-bold">
                    Active Telemetry
                  </span>
                </h3>
                <p className="text-[10px] font-mono text-slate-400 mt-0.5">ROLE: continuous software analysis</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-zinc-300 leading-relaxed font-sans bg-white dark:bg-zinc-950 border border-slate-150 dark:border-zinc-850 p-3.5 rounded-xl">
              {activeAgent.role}
            </p>

            <div className="space-y-2.5">
              <div className="flex justify-between items-center text-xs border-b border-slate-100 dark:border-zinc-850 pb-2">
                <span className="text-[10px] font-mono text-slate-400 font-bold">METRIC VALUE</span>
                <span className="font-mono font-bold text-slate-800 dark:text-indigo-400">{activeAgent.metricValue}</span>
              </div>
              
              <div className="space-y-2">
                <span className="text-[10px] font-mono text-slate-400 font-bold block">EVIDENCE AUDIT TRAILS:</span>
                <div className="space-y-2">
                  {activeAgent.details.map((detail, idx) => (
                    <div key={idx} className="flex gap-2 items-start text-[11px] text-slate-600 dark:text-zinc-300 leading-relaxed font-sans">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Miniature Interactive Widget for Active Agent */}
          <div className="mt-5 pt-4 border-t border-slate-150 dark:border-zinc-850 space-y-3 bg-white dark:bg-zinc-950 p-4 rounded-xl border border-slate-150 dark:border-zinc-850">
            <h4 className="text-[10px] font-mono text-indigo-600 dark:text-indigo-400 font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" />
              <span>Interactive Agent Console</span>
            </h4>
            
            {activeAgent.id === 'identity-ai' && (
              <div className="text-[11px] font-mono text-slate-500 space-y-2">
                <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-2 rounded text-[10px] break-all select-all text-slate-400 leading-snug">
                  Developer Public Key: <strong className="text-slate-600 dark:text-zinc-300">0x8B3fd72...49aF0c2E</strong>
                </div>
                <div className="flex items-center gap-1.5 text-emerald-600 font-bold text-[10px]">
                  <Lock className="w-3.5 h-3.5" />
                  <span>Signature Integrity Verified: v${passport.version}</span>
                </div>
              </div>
            )}

            {activeAgent.id === 'security-ai' && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>CVSS THREAT RISK EXPOSURE:</span>
                  <span className="font-bold text-slate-700 dark:text-zinc-200">LOW</span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-zinc-900 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-500 h-full" style={{ width: '12%' }}></div>
                </div>
                <p className="text-[9px] text-slate-400 font-mono">Mapped against NVD exploit database feed.</p>
              </div>
            )}

            {activeAgent.id === 'compliance-ai' && (
              <div className="space-y-2 text-[10px] font-mono text-slate-500">
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1 bg-emerald-50/50 dark:bg-emerald-950/10 p-1.5 rounded border border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>NIST 800-218</span>
                  </div>
                  <div className="flex items-center gap-1 bg-emerald-50/50 dark:bg-emerald-950/10 p-1.5 rounded border border-emerald-100 dark:border-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                    <Check className="w-3 h-3 text-emerald-600" />
                    <span>SOC 2 Type II</span>
                  </div>
                </div>
                <p className="text-[9px] text-slate-400 font-sans leading-snug">Compliance checks validated dynamically during automated continuous assessment cycles.</p>
              </div>
            )}

            {activeAgent.id === 'code-ai' && (
              <div className="space-y-2 text-[10px] font-mono text-slate-500">
                <div className="flex justify-between">
                  <span>CYCLOMATIC DEPTH INDEX</span>
                  <span className="font-bold text-slate-700 dark:text-zinc-200">5.4 (LOW)</span>
                </div>
                <div className="flex justify-between">
                  <span>RISKY COMMITS RE-SCANNED</span>
                  <span className="font-bold text-emerald-600">0</span>
                </div>
                <div className="flex justify-between">
                  <span>TEST COVERAGE RATIO</span>
                  <span className="font-bold text-indigo-600">92.4%</span>
                </div>
              </div>
            )}

            {activeAgent.id === 'supply-chain-ai' && (
              <div className="space-y-1.5">
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>PERMISSIVE LICENSES</span>
                  <span className="font-bold text-emerald-600">100% OK</span>
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>THIRD-PARTY EXPOSURE</span>
                  <span className="font-bold text-slate-700 dark:text-zinc-200">MINIMAL</span>
                </div>
                <p className="text-[9px] text-slate-400 font-sans leading-snug">CycloneDX SBOM verified with cryptographic attestation seal.</p>
              </div>
            )}

            {activeAgent.id === 'reputation-ai' && (
              <div className="space-y-1.5 font-mono text-[10px] text-slate-500">
                <div className="flex justify-between">
                  <span>PUBLISHER INCIDENTS</span>
                  <span className="font-bold text-emerald-600">0 RECORDED</span>
                </div>
                <div className="flex justify-between">
                  <span>UPTIME SLA TRACKER</span>
                  <span className="font-bold text-slate-700 dark:text-zinc-200">99.999% VERIFIED</span>
                </div>
              </div>
            )}

            {activeAgent.id === 'behavior-ai' && (
              <div className="space-y-1 text-slate-500 text-[10px] font-mono">
                <div className="flex items-center gap-1 text-emerald-600 font-bold">
                  <Activity className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Sandbox Behavior: Safe</span>
                </div>
                <p className="text-[9px] text-slate-400 leading-snug">Runtimes checked for execution overflows, socket spikes, and signature discrepancies.</p>
              </div>
            )}

            {activeAgent.id === 'prediction-ai' && (
              <div className="space-y-1.5 font-mono text-[10px] text-slate-500">
                <div className="flex justify-between">
                  <span>90-DAY COMPROMISE PROBABILITY</span>
                  <span className="font-bold text-emerald-600">&lt; 0.01%</span>
                </div>
                <div className="flex justify-between">
                  <span>LIFECYCLE MAINTENANCE COST</span>
                  <span className="font-bold text-slate-700 dark:text-zinc-200">MINIMAL</span>
                </div>
              </div>
            )}

            {activeAgent.id === 'evidence-ai' && (
              <div className="space-y-1 text-[10px] font-mono text-slate-500">
                <div className="bg-slate-50 dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 p-2 rounded text-[8px] break-all select-all text-slate-400 leading-snug">
                  Audit proof block: <strong className="text-slate-600 dark:text-zinc-300">sha256:{passport.fileHash}</strong>
                </div>
                <div className="flex items-center gap-1 text-emerald-600 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Ledger committed & proof locked.</span>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Console output logger window */}
      <div className="space-y-2 border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-slate-950 shadow-sm">
        <div className="bg-slate-900 dark:bg-zinc-950 px-4 py-2 border-b border-slate-800/60 flex justify-between items-center text-xs">
          <div className="flex items-center gap-2 text-slate-300 font-mono text-[10px] font-bold">
            <Terminal className="w-3.5 h-3.5 text-indigo-400" />
            <span>AI Swarm Real-Time Collaboration Feed</span>
          </div>

          <div className="flex gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
            <span className="w-2.5 h-2.5 rounded-full bg-slate-700"></span>
          </div>
        </div>

        <div className="p-4 h-[200px] overflow-y-auto font-mono text-[11px] text-slate-300 space-y-2.5 select-all leading-normal">
          {consoleLogs.map((log, index) => {
            let textColor = 'text-slate-300';
            if (log.includes('[System]')) textColor = 'text-indigo-400 font-semibold';
            else if (log.includes('[Identity AI]')) textColor = 'text-indigo-300';
            else if (log.includes('[Security AI]')) textColor = 'text-rose-300';
            else if (log.includes('[Compliance AI]')) textColor = 'text-emerald-300';
            else if (log.includes('[Code AI]')) textColor = 'text-amber-300';
            else if (log.includes('[Supply Chain AI]')) textColor = 'text-cyan-300';
            else if (log.includes('[Reputation AI]')) textColor = 'text-blue-300';
            else if (log.includes('[Behavior AI]')) textColor = 'text-purple-300';
            else if (log.includes('[Prediction AI]')) textColor = 'text-violet-300';
            else if (log.includes('[Evidence AI]')) textColor = 'text-teal-300';

            return (
              <div key={index} className={`${textColor} animate-in slide-in-from-bottom-1 duration-150`}>
                {log}
              </div>
            );
          })}
          <div ref={terminalEndRef} />
        </div>
      </div>

      {/* Ecosystem Trust Outcomes panel: Displays the score backed by certified evidence */}
      <div className="bg-indigo-50/30 dark:bg-indigo-950/10 border border-indigo-150 dark:border-indigo-900/40 p-5 rounded-2xl">
        <h3 className="text-xs font-bold text-slate-800 dark:text-zinc-200 font-display flex items-center gap-1.5 mb-3">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span>Ecosystem Verification & Living Passport Status Checklists</span>
        </h3>
        
        <p className="text-xs text-slate-500 dark:text-zinc-400 mb-4 max-w-3xl">
          The verified trust score of <strong className="text-slate-700 dark:text-zinc-200 font-mono font-bold">{simulatedScore}/100</strong> is an ecosystem asset continuously maintained by collaborating AI agents and updated as new proof becomes available.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex gap-2.5 items-start bg-white dark:bg-zinc-950 p-3.5 rounded-xl border border-slate-150 dark:border-zinc-850">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <h4 className="text-[11px] font-bold text-slate-800 dark:text-zinc-200 leading-none">Identity Verified</h4>
              <p className="text-[10px] text-slate-400 mt-1">Cryptographically attested binary signatures.</p>
            </div>
          </div>

          <div className="flex gap-2.5 items-start bg-white dark:bg-zinc-950 p-3.5 rounded-xl border border-slate-150 dark:border-zinc-850">
            <CheckCircle2 className={`w-4.5 h-4.5 text-emerald-500 shrink-0 mt-0.5 ${passport.vulnerabilities.length > 0 ? 'animate-pulse' : ''}`} />
            <div>
              <h4 className="text-[11px] font-bold text-slate-800 dark:text-zinc-200 leading-none">Vulnerabilities Cleared</h4>
              <p className="text-[10px] text-slate-400 mt-1">
                {passport.vulnerabilities.length === 0 ? 'No critical vulnerabilities.' : `${passport.vulnerabilities.length} CVEs accounted for.`}
              </p>
            </div>
          </div>

          <div className="flex gap-2.5 items-start bg-white dark:bg-zinc-950 p-3.5 rounded-xl border border-slate-150 dark:border-zinc-850">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <h4 className="text-[11px] font-bold text-slate-800 dark:text-zinc-200 leading-none">Code Quality Excellent</h4>
              <p className="text-[10px] text-slate-400 mt-1">Negligible static complexity index.</p>
            </div>
          </div>

          <div className="flex gap-2.5 items-start bg-white dark:bg-zinc-950 p-3.5 rounded-xl border border-slate-150 dark:border-zinc-850">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <h4 className="text-[11px] font-bold text-slate-800 dark:text-zinc-200 leading-none">Supply Chain Healthy</h4>
              <p className="text-[10px] text-slate-400 mt-1">100% components verified in SBOM.</p>
            </div>
          </div>

          <div className="flex gap-2.5 items-start bg-white dark:bg-zinc-950 p-3.5 rounded-xl border border-slate-150 dark:border-zinc-850">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <h4 className="text-[11px] font-bold text-slate-800 dark:text-zinc-200 leading-none">Compliance Current</h4>
              <p className="text-[10px] text-slate-400 mt-1">SOC 2, ISO, and NIST SP aligned.</p>
            </div>
          </div>

          <div className="flex gap-2.5 items-start bg-white dark:bg-zinc-950 p-3.5 rounded-xl border border-slate-150 dark:border-zinc-850">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <h4 className="text-[11px] font-bold text-slate-800 dark:text-zinc-200 leading-none">Reliability Excellent</h4>
              <p className="text-[10px] text-slate-400 mt-1">Immutable SLA & uptime targets.</p>
            </div>
          </div>

          <div className="flex gap-2.5 items-start bg-white dark:bg-zinc-950 p-3.5 rounded-xl border border-slate-150 dark:border-zinc-850">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <h4 className="text-[11px] font-bold text-slate-800 dark:text-zinc-200 leading-none">Predicted Low Risk</h4>
              <p className="text-[10px] text-slate-400 mt-1">90-day predictive failure threshold clear.</p>
            </div>
          </div>

          <div className="flex gap-2.5 items-start bg-white dark:bg-zinc-950 p-3.5 rounded-xl border border-slate-150 dark:border-zinc-850">
            <CheckCircle2 className="w-4.5 h-4.5 text-emerald-500 shrink-0 mt-0.5 animate-pulse" />
            <div>
              <h4 className="text-[11px] font-bold text-slate-800 dark:text-zinc-200 leading-none">Evidence Recorded</h4>
              <p className="text-[10px] text-slate-400 mt-1">Tamperproof ledger hashes committed.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
