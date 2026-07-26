import React from 'react';
import { ArrowRight, FileCheck2, ShieldAlert, Users } from 'lucide-react';
import { apiFetch } from '../utils/apiClient';

export default function SalesOnePager({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [demoState, setDemoState] = React.useState('');
  const createDemo = async () => {
    setDemoState('Creating clearly labeled demo…');
    try {
      const response = await apiFetch('/api/demo/client', { method: 'POST' });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(body.error || 'Demo client could not be created.');
      window.dispatchEvent(new Event('refresh-data'));
      setDemoState(body.created ? 'Demo client created.' : 'Demo client already exists.');
      onNavigate('clients');
    } catch (error: any) {
      setDemoState(error.message || 'Demo client could not be created.');
    }
  };
  return (
    <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl">
      <div className="bg-[#07111f] px-8 py-10 text-white md:px-12">
        <div className="text-xs font-bold uppercase tracking-[0.2em] text-cyan-300">90-second MSP briefing</div>
        <h1 className="mt-4 max-w-4xl text-4xl font-display font-semibold leading-tight">Turn software supply-chain evidence into a client conversation.</h1>
        <p className="mt-4 max-w-3xl text-base leading-7 text-slate-300">SPR keeps tenant-scoped software records, provider observations, findings, and review-ready reports in one place. It helps organize CRA evidence; it does not replace legal advice or conformity assessment.</p>
      </div>
      <div className="grid gap-6 p-8 md:grid-cols-3 md:p-12">
        {[
          [ShieldAlert, 'The pressure', 'Customers need traceable vulnerability and software-component evidence, not another spreadsheet.'],
          [Users, 'The MSP opportunity', 'Deliver a repeatable evidence service across clients while keeping every tenant isolated.'],
          [FileCheck2, 'The SPR role', 'Collect records, expose gaps, map CRA review areas, and export clearly qualified client reports.']
        ].map(([Icon, title, body]: any) => <div key={title} className="rounded-2xl bg-slate-50 p-6"><Icon className="h-6 w-6 text-indigo-600" /><h2 className="mt-4 font-display font-semibold text-slate-900">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{body}</p></div>)}
      </div>
      <div className="flex flex-col gap-4 border-t border-slate-100 px-8 py-6 md:flex-row md:items-center md:justify-between md:px-12">
        <p className="text-sm font-semibold text-slate-800">Next: show a clearly labeled demo client, then open its evidence report.</p>
        <div className="flex flex-col items-end gap-2">
          <button onClick={createDemo} className="inline-flex items-center justify-center gap-2 rounded-xl bg-indigo-600 px-5 py-3 text-sm font-bold text-white">Create/open labeled demo <ArrowRight className="w-4 h-4" /></button>
          {demoState && <span className="text-xs text-slate-500">{demoState}</span>}
        </div>
      </div>
    </div>
  );
}
