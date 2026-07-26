import React from 'react';
import { ArrowRight, Building2, FileCheck2, ScanLine } from 'lucide-react';

const roleGuidance: Record<string, { title: string; body: string; action: string; tab: string }> = {
  Owner: { title: 'Set up your MSP workspace', body: 'Add the first client, save your report branding, then invite technicians.', action: 'Add a client', tab: 'clients' },
  Admin: { title: 'Configure evidence collection', body: 'Connect a source and register the software your team needs to review.', action: 'Open integrations', tab: 'integrations' },
  Technician: { title: 'Start with a real scan', body: 'Choose a registered passport and run an evidence collector. Empty results stay empty until a source responds.', action: 'Open scans', tab: 'scans' },
  Client: { title: 'Your evidence workspace is ready', body: 'Review the software records shared with you and flag evidence that needs clarification.', action: 'Review passports', tab: 'passports' },
  Viewer: { title: 'Review available evidence', body: 'This workspace has no records yet. An Owner or Technician can add the first client and scan.', action: 'View reports', tab: 'reports' }
};

export default function FirstRunPanel({ role, onNavigate }: { role: string; onNavigate: (tab: string) => void }) {
  const guide = roleGuidance[role] || roleGuidance.Viewer;
  return (
    <div className="mx-auto mt-12 max-w-2xl rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-600"><Building2 /></div>
      <h2 className="mt-4 text-2xl font-display font-semibold text-slate-900 dark:text-white">{guide.title}</h2>
      <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-slate-500">{guide.body}</p>
      <div className="mt-6 flex justify-center gap-3 text-xs text-slate-500"><FileCheck2 className="w-4 h-4" /> Tenant scoped <ScanLine className="ml-3 w-4 h-4" /> Provider-backed evidence</div>
      <button onClick={() => onNavigate(guide.tab)} className="mt-7 inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white hover:bg-indigo-700">{guide.action}<ArrowRight className="w-4 h-4" /></button>
    </div>
  );
}
