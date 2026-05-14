'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetchForm, readApiError } from '@/lib/api';
import { getOpenAIKey } from '@/lib/apiKey';
import { getSessionId } from '@/lib/session';
import { newReportId, saveReport } from '@/lib/store';
import type { PolicyReport } from '@/lib/types';
import { ApiKeyPanel } from './ApiKeyPanel';
import { AGENT_COLORS, AgentBadge } from './AgentBadge';

const PRESETS = [
  'India bans social media for under-16 users',
  'Universal Basic Income in India',
  'Increase GST from 18% → 22%',
  'Four-day work week in India',
  'Mandatory AI literacy in school curriculum by 2030',
];

const AGENTS: { label: string; title: string }[] = [
  { label: 'Economist', title: 'Economist Agent' },
  { label: 'Social', title: 'Social Agent' },
  { label: 'Political', title: 'Political Agent' },
  { label: 'Legal', title: 'Legal Agent' },
  { label: 'Environmental', title: 'Environmental Agent' },
  { label: 'Historian', title: 'Historian Agent' },
  { label: 'Critic', title: 'Critic Agent' },
  { label: 'Citizen', title: 'Citizen Agent' },
];

export function PolicyLab() {
  const router = useRouter();
  const [policyText, setPolicyText] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [busy, setBusy] = useState(false);
  const [stage, setStage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    const sync = () => setHasKey(!!getOpenAIKey());
    sync();
    window.addEventListener('govsim-key-changed', sync);
    return () => window.removeEventListener('govsim-key-changed', sync);
  }, []);

  const canSubmit = useMemo(
    () => !busy && hasKey && (policyText.trim().length > 12 || files.length > 0),
    [busy, files.length, hasKey, policyText],
  );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    setStage('Embedding documents and indexing into Qdrant...');

    try {
      const form = new FormData();
      form.set('policy_text', policyText);
      form.set('mode', 'single');
      form.set('session_id', getSessionId());
      files.forEach((f) => form.append('files', f));

      setStage('8 agents reasoning in parallel...');
      const resp = await apiFetchForm('/api/analyze', form);
      if (!resp.ok) throw new Error(await readApiError(resp, `Analysis failed (${resp.status})`));
      const data = await resp.json();

      const id = newReportId();
      const report: PolicyReport = {
        id,
        createdAt: Date.now(),
        title: data.title || policyText.slice(0, 90),
        mode: 'single',
        policyText,
        policyBText: '',
        agents: data.agents || [],
        scorecard: data.scorecard,
        scorecard_a: data.scorecard_a || null,
        scorecard_b: data.scorecard_b || null,
        future: data.future || [],
        future_a: data.future_a || [],
        future_b: data.future_b || [],
        battle: data.battle || [],
        battle_verdict: data.battle_verdict || null,
        judges: data.judges || [],
        critic_summary: data.critic_summary || '',
        sources: data.sources || [],
        mcp_insights: data.mcp_insights || [],
        memory_note: data.memory_note || '',
      };
      saveReport(report);
      router.push(`/report/${id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to run simulation');
    } finally {
      setBusy(false);
      setStage('');
    }
  };

  return (
    <form onSubmit={submit} className="mt-8 grid gap-6 md:grid-cols-12">
      <div className="md:col-span-8 space-y-6">
        <div className="card-lifted p-6">
          <div className="flex items-center justify-between gap-3">
            <div className="label">Policy proposal</div>
            <span className="chip chip-primary">Single policy</span>
          </div>
          <textarea
            value={policyText}
            onChange={(e) => setPolicyText(e.target.value)}
            rows={6}
            placeholder='e.g. "Universal Basic Income in India funded by a 1% wealth tax."'
            className="field mt-3 text-base"
            required={files.length === 0}
          />
          <div className="mt-4 flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPolicyText(p)}
                className="chip hover:border-primary hover:bg-primary-50 hover:text-primary-700 transition"
              >
                {p}
              </button>
            ))}
          </div>
        </div>

        <div className="card p-6">
          <label className="block">
            <span className="label">Upload PDFs · research · budget docs</span>
            <input
              type="file"
              multiple
              accept=".pdf,.txt,.md"
              onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
              className="field mt-2"
            />
          </label>
          {files.length > 0 && (
            <p className="mt-3 label">
              {files.length} file{files.length > 1 ? 's' : ''} attached — chunks will be embedded and persisted to Qdrant.
            </p>
          )}
        </div>

        {error && (
          <div className="card p-4 border-red-200 bg-red-50 text-sm text-red-700" style={{ borderColor: '#fecaca', background: '#fef2f2' }}>
            {error}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={!canSubmit} className="btn btn-primary">
            {busy ? 'Running…' : 'Run multi-agent analysis'}
          </button>
          <span className="label">8 agents · RAG · MCP · memory</span>
        </div>

        {busy && (
          <div className="card p-5">
            <div className="label">{stage}</div>
            <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-neutral-100">
              <div className="h-full w-1/2 animate-shimmer rounded-full" />
            </div>
          </div>
        )}
      </div>

      <aside className="md:col-span-4 space-y-6">
        <ApiKeyPanel onChange={setHasKey} />

        <div className="card p-5">
          <div className="label">Active agents</div>
          <ul className="mt-3 grid grid-cols-2 gap-2">
            {AGENTS.map((a) => {
              const c = AGENT_COLORS[a.title];
              return (
                <li
                  key={a.title}
                  className="flex items-center gap-2 rounded-xl border px-2.5 py-2"
                  style={{ background: c.bg, borderColor: c.ring, color: c.fg }}
                >
                  <AgentBadge title={a.title} size="sm" />
                  <span className="text-xs font-semibold">{a.label}</span>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="card p-5">
          <div className="label">How it runs</div>
          <ol className="mt-3 space-y-2 text-sm text-neutral-700">
            <li><span className="font-display font-bold text-primary mr-1">1.</span> Text + PDFs chunked &amp; embedded</li>
            <li><span className="font-display font-bold text-primary mr-1">2.</span> Stored in Qdrant (persistent)</li>
            <li><span className="font-display font-bold text-primary mr-1">3.</span> MCP adapters fan-out in parallel</li>
            <li><span className="font-display font-bold text-primary mr-1">4.</span> 8 agents reason with shared context</li>
            <li><span className="font-display font-bold text-primary mr-1">5.</span> Synthesizer → scorecard + future</li>
          </ol>
        </div>
      </aside>
    </form>
  );
}
