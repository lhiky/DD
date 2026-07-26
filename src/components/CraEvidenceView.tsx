import React from 'react';
import { AlertTriangle, CheckCircle2, CircleDashed, FileSearch, ShieldCheck } from 'lucide-react';
import { SoftwarePassport } from '../types';

const requirements = [
  { article: 'Article 10', title: 'Essential cybersecurity requirements', evidence: ['Security Scan', 'Build Log'] },
  { article: 'Article 13', title: 'Manufacturer obligations and risk assessment', evidence: ['Audit Report', 'Security Scan'] },
  { article: 'Article 14', title: 'Vulnerability handling and reporting', evidence: ['Security Scan'] },
  { article: 'Article 27', title: 'Technical documentation', evidence: ['Audit Report', 'Attestation'] },
  { article: 'Annex I, Part I', title: 'Security properties of products', evidence: ['Signature', 'Build Log'] },
  { article: 'Annex I, Part II', title: 'Vulnerability handling requirements', evidence: ['Security Scan', 'Audit Report'] }
] as const;

export default function CraEvidenceView({ passports }: { passports: SoftwarePassport[] }) {
  const evidence = passports.flatMap(passport => passport.evidence || []);
  const rows = requirements.map(requirement => {
    const matching = evidence.filter(item => requirement.evidence.includes(item.type as never));
    const verified = matching.filter(item => item.status === 'VERIFIED');
    const status = matching.length === 0 ? 'Missing' : verified.length === matching.length ? 'Evidence verified' : 'Review required';
    return { ...requirement, matching, verified, status };
  });

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 p-7 text-white shadow-xl">
        <div className="flex items-center gap-2 text-indigo-200 text-xs font-bold uppercase tracking-[0.18em]"><ShieldCheck className="w-4 h-4" /> CRA evidence workspace</div>
        <h1 className="mt-3 text-3xl font-display font-semibold">Requirement → Evidence Status</h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-300">A review aid based only on evidence stored in this tenant. It does not determine legal applicability or certify conformity with Regulation (EU) 2024/2847.</p>
      </div>
      <div className="grid gap-3">
        {rows.map(row => (
          <section key={row.article} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-[10px] font-mono font-bold uppercase tracking-widest text-indigo-600">{row.article}</div>
                <h2 className="mt-1 font-display font-semibold text-slate-900 dark:text-white">{row.title}</h2>
                <p className="mt-1 text-xs text-slate-500">Expected evidence types: {row.evidence.join(', ')}</p>
              </div>
              <div className={`inline-flex items-center gap-2 self-start rounded-full px-3 py-1.5 text-xs font-bold ${
                row.status === 'Evidence verified' ? 'bg-emerald-50 text-emerald-700' : row.status === 'Missing' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'
              }`}>
                {row.status === 'Evidence verified' ? <CheckCircle2 className="w-4 h-4" /> : row.status === 'Missing' ? <AlertTriangle className="w-4 h-4" /> : <CircleDashed className="w-4 h-4" />}
                {row.status}
              </div>
            </div>
            <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-600 dark:border-zinc-800 dark:text-zinc-300">
              <FileSearch className="mr-2 inline h-4 w-4 text-slate-400" />
              {row.matching.length} matching record(s); {row.verified.length} independently verified.
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
