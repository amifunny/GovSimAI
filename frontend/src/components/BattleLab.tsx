'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetchForm, readApiError } from '@/lib/api';
import { getOpenAIKey } from '@/lib/apiKey';
import { getSessionId } from '@/lib/session';
import { newReportId, saveReport } from '@/lib/store';
import type { PolicyReport } from '@/lib/types';
import { ApiKeyPanel } from './ApiKeyPanel';

export function BattleLab() {
  const router = useRouter();
  const [a, setA] = useState('Universal Basic Income in India');
  const [b, setB] = useState('Targeted Tax Cuts for MSMEs and Startups');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasKey, setHasKey] = useState(false);

  useEffect(() => {
    const sync = () => setHasKey(!!getOpenAIKey());
    sync();
    window.addEventListener('govsim-key-changed', sync);
    return () => window.removeEventListener('govsim-key-changed', sync);
  }, []);

  const canSubmit = useMemo(
    () => !busy && hasKey && a.trim().length > 8 && b.trim().length > 8,
    [busy, hasKey, a, b],
  );

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.set('policy_text', a);
      form.set('policy_b_text', b);
      form.set('mode', 'battle');
      form.set('session_id', getSessionId());

      const resp = await apiFetchForm('/api/analyze', form);
      if (!resp.ok) throw new Error(await readApiError(resp, `Battle failed (${resp.status})`));
      const data = await resp.json();

      const id = newReportId();
      const report: PolicyReport = {
        id,
        createdAt: Date.now(),
        title: `${a.slice(0, 38)}  vs  ${b.slice(0, 38)}`,
        mode: 'battle',
        policyText: a,
        policyBText: b,
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
      setError(err instanceof Error ? err.message : 'Failed to run battle');
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="mt-8 grid gap-6 md:grid-cols-12">
      <div className="md:col-span-8 space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card-tinted-primary p-6">
            <div className="flex items-center justify-between">
              <span className="chip chip-primary">Policy A</span>
              <span className="font-display text-xs font-bold text-primary-700">CHALLENGER 1</span>
            </div>
            <textarea
              value={a}
              onChange={(e) => setA(e.target.value)}
              rows={6}
              className="field mt-3"
              required
            />
          </div>
          <div className="card-tinted-tertiary p-6">
            <div className="flex items-center justify-between">
              <span className="chip chip-tertiary">Policy B</span>
              <span className="font-display text-xs font-bold" style={{ color: '#047857' }}>CHALLENGER 2</span>
            </div>
            <textarea
              value={b}
              onChange={(e) => setB(e.target.value)}
              rows={6}
              className="field mt-3"
              required
            />
          </div>
        </div>

        <div className="card p-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted">
            All 8 agents rate <span className="text-strong font-semibold">both</span> policies separately, then a 3-round live debate is staged and a winner is declared.
          </p>
          <button type="submit" disabled={!canSubmit} className="btn btn-primary">
            {busy ? 'Staging debate…' : 'Start battle'}
          </button>
        </div>

        {error && (
          <div className="card p-4 text-sm text-red-700" style={{ borderColor: '#fecaca', background: '#fef2f2' }}>
            {error}
          </div>
        )}
      </div>

      <aside className="md:col-span-4 space-y-6">
        <ApiKeyPanel onChange={setHasKey} />
        <div className="card p-5">
          <div className="label">How battle mode works</div>
          <ol className="mt-3 space-y-2 text-sm text-neutral-700">
            <li><span className="font-display font-bold text-primary mr-1">1.</span> Each agent scores both policies in their domain</li>
            <li><span className="font-display font-bold text-primary mr-1">2.</span> A 3-round live debate is staged between sides</li>
            <li><span className="font-display font-bold text-primary mr-1">3.</span> Articles to read are attached for justification</li>
            <li><span className="font-display font-bold text-primary mr-1">4.</span> The agents' verdict crowns a winner</li>
          </ol>
        </div>
      </aside>
    </form>
  );
}
