import React, { useEffect, useState } from 'react';
import { AlertTriangle, Brain, CheckCircle2, RefreshCw } from 'lucide-react';
import { apiFetch } from '../utils/apiClient';

interface PassportSummary {
  id: string;
  name: string;
  version: string;
}

interface VectorEntry {
  dimension: string;
  state: 'known' | 'partially_known' | 'unknown' | 'stale' | 'expired' | 'unavailable';
  score: number | null;
  confidence: number | null;
  completeness: number;
  explanation: string;
  evidenceCount: number;
  openFindingCount: number;
  nextRefreshAt: string | null;
  freshnessStatus: string;
  limitations: string[];
  observations: Array<{
    evidenceId: string;
    statement: string;
    source: string;
    timestamp: string;
    evidenceType: string;
    verificationMethod: string;
    status: string;
    confidence: number;
  }>;
  missingEvidence: string[];
}

interface TrustObservation {
  schemaVersion: string;
  rule: string;
  observedAt: string;
  vector: Record<string, VectorEntry>;
  unknownLayer: {
    knownDimensions: string[];
    unknownDimensions: string[];
    completeness: number;
  };
}

export default function TrustBrainView(_props: { userRole?: string }) {
  const [passports, setPassports] = useState<PassportSummary[]>([]);
  const [passportId, setPassportId] = useState('');
  const [observation, setObservation] = useState<TrustObservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    apiFetch('/api/passports')
      .then(async response => {
        if (!response.ok) throw new Error('Could not load passports.');
        return response.json();
      })
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setPassports(list);
        if (list[0]) setPassportId(list[0].id);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const loadObservation = async (selectedId: string) => {
    if (!selectedId) return;
    setLoading(true);
    setError('');
    setObservation(null);
    try {
      const response = await apiFetch(`/api/passports/${encodeURIComponent(selectedId)}/trust-observation`);
      if (!response.ok) throw new Error('Trust observation could not be built.');
      setObservation(await response.json());
    } catch (err: any) {
      setError(err?.message || 'Trust observation unavailable.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (passportId) loadObservation(passportId);
  }, [passportId]);

  const vectors = observation ? Object.values(observation.vector) : [];

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <div className="flex items-center gap-2">
              <Brain className="h-6 w-6 text-indigo-500" />
              <h1 className="text-xl font-bold">AI Brain — Evidence View</h1>
            </div>
            <p className="mt-2 text-sm text-slate-500 dark:text-zinc-400">
              This view does not generate trust. It displays the server-side observation record and its unknown areas.
            </p>
          </div>
          <div className="flex gap-2">
            <select
              aria-label="Software Passport"
              value={passportId}
              onChange={event => setPassportId(event.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
            >
              {passports.map(passport => (
                <option key={passport.id} value={passport.id}>{passport.name} {passport.version}</option>
              ))}
            </select>
            <button
              onClick={() => loadObservation(passportId)}
              disabled={!passportId || loading}
              className="rounded-xl border border-slate-300 p-2 disabled:opacity-40 dark:border-zinc-700"
              aria-label="Refresh observation"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {error && <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-sm text-rose-700">{error}</div>}
      {!loading && passports.length === 0 && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-5 text-sm text-amber-800">
          Add a Software Passport before requesting a trust observation.
        </div>
      )}
      {observation && (
        <>
          <p className="rounded-xl border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900 dark:border-indigo-900 dark:bg-indigo-950/30 dark:text-indigo-200">
            Completeness measures how much of SPR’s defined observable evidence set is currently available. It does not measure whether the software is safe or compliant.
          </p>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-xs uppercase text-slate-500">Evidence coverage</p>
              <p className="mt-1 text-2xl font-bold">{Math.round(observation.unknownLayer.completeness * 100)}%</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-xs uppercase text-slate-500">Observed dimensions</p>
              <p className="mt-1 text-2xl font-bold">{observation.unknownLayer.knownDimensions.length}</p>
            </div>
            <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-xs uppercase text-slate-500">Unknown dimensions</p>
              <p className="mt-1 text-2xl font-bold">{observation.unknownLayer.unknownDimensions.length}</p>
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {vectors.map(entry => (
              <section key={entry.dimension} className="rounded-2xl border border-slate-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="font-semibold capitalize">{entry.dimension.replace(/([A-Z])/g, ' $1')}</h2>
                  <span className={`rounded-full px-2 py-1 text-xs font-semibold ${
                    entry.state === 'unknown' ? 'bg-slate-100 text-slate-600'
                      : entry.state === 'unavailable' || entry.state === 'expired' ? 'bg-rose-100 text-rose-700'
                      : entry.state === 'stale' ? 'bg-amber-100 text-amber-800'
                      : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    {entry.state.replaceAll('_', ' ')} · score {entry.score ?? '—'}
                  </span>
                </div>
                <p className="mt-2 text-sm text-slate-500">{entry.explanation}</p>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-slate-500">
                  <span>Confidence: {entry.confidence === null ? 'Unknown' : `${Math.round(entry.confidence * 100)}%`}</span>
                  <span>Completeness: {Math.round(entry.completeness * 100)}%</span>
                  <span>Evidence: {entry.evidenceCount}</span>
                  <span>Open findings: {entry.openFindingCount}</span>
                  <span>Freshness: {entry.freshnessStatus}</span>
                  <span>Next refresh: {entry.nextRefreshAt ? new Date(entry.nextRefreshAt).toLocaleString() : 'Unknown'}</span>
                </div>
                {entry.observations.map(item => (
                  <div key={item.evidenceId} className="mt-3 rounded-xl border border-slate-200 p-3 text-xs dark:border-zinc-700">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                      <strong>{item.statement}</strong>
                    </div>
                    <p className="mt-2">Source: {item.source}</p>
                    <p>Method: {item.verificationMethod}</p>
                    <p>Recorded: {item.timestamp}</p>
                    <p>Confidence: {Math.round(item.confidence * 100)}%</p>
                  </div>
                ))}
                {entry.limitations.map(limitation => (
                  <p key={limitation} className="mt-2 text-xs text-slate-500">Limitation: {limitation}</p>
                ))}
                {entry.missingEvidence.map(missing => (
                  <div key={missing} className="mt-3 flex gap-2 rounded-xl bg-amber-50 p-3 text-xs text-amber-800">
                    <AlertTriangle className="h-4 w-4 shrink-0" />
                    <span>Missing: {missing}</span>
                  </div>
                ))}
              </section>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
