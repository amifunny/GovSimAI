'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import type { PolicyReport } from '@/lib/types';
import { getReport, deleteReport } from '@/lib/store';
import { AgentCard } from './AgentCard';
import { ScorePill } from './ScorePill';
import { FutureTimeline, FutureCompare } from './FutureTimeline';
import { SourcesList } from './SourcesList';
import { McpPanel } from './McpPanel';
import { BattleTranscript } from './BattleTranscript';
import { BattleVerdict } from './BattleVerdict';
import { BattleScorecard } from './BattleScorecard';
import { JudgesPanel } from './JudgesPanel';
import { RoundHeader } from './RoundHeader';

const RISK_TINT: Record<string, string> = {
  Low: 'card-tinted-tertiary',
  Medium: 'card-tinted-primary',
  High: 'card-tinted-secondary',
};

export function ReportView({ id }: { id: string }) {
  const [r, setR] = useState<PolicyReport | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const found = getReport(id);
    if (!found) setNotFound(true);
    else setR(found);
  }, [id]);

  if (notFound) {
    return (
      <div className="card-lifted p-8 text-center">
        <h2 className="font-display text-3xl font-extrabold text-strong">No report found</h2>
        <p className="mt-3 text-muted text-sm">Reports live only in your browser. Run a new simulation to get a report.</p>
        <div className="mt-6"><Link href="/lab" className="btn btn-primary">Start a new run</Link></div>
      </div>
    );
  }
  if (!r) {
    return <div className="card p-8 text-center text-muted">loading…</div>;
  }

  const composite =
    (r.scorecard.economic_impact +
      r.scorecard.social_impact +
      r.scorecard.political_feasibility +
      (10 - r.scorecard.legal_complexity) +
      r.scorecard.environmental_impact) / 5;

  const isBattle = r.mode === 'battle';
  const hasJudges = isBattle && (r.judges?.length ?? 0) > 0;
  const hasFutureCompare = isBattle && (r.future_a?.length ?? 0) > 0 && (r.future_b?.length ?? 0) > 0;

  return (
    <div className="space-y-10">
      <div className="no-print flex flex-wrap items-center justify-between gap-3">
        <Link href="/history" className="btn btn-ghost">← All reports</Link>
        <div className="flex gap-2">
          <button onClick={() => window.print()} className="btn btn-outline btn-sm">Print / PDF</button>
          <button
            onClick={() => {
              if (confirm('Delete this report?')) {
                deleteReport(r.id);
                window.location.href = '/history';
              }
            }}
            className="btn btn-ghost btn-sm"
            style={{ color: '#b91c1c' }}
          >
            Delete
          </button>
        </div>
      </div>

      {/* Headline */}
      <section className="card-lifted p-6 md:p-8">
        <div className="flex flex-wrap items-start justify-between gap-6">
          <div className="max-w-2xl">
            <span className="chip chip-primary">
              {isBattle ? 'Policy battle report' : 'Policy simulation report'}
            </span>
            <h1 className="mt-3 font-display text-3xl leading-tight md:text-5xl font-extrabold text-strong">
              {r.title}
            </h1>
            <div className="mt-3 label">
              {new Date(r.createdAt).toLocaleString()} · {r.agents.length} agents
            </div>
            {r.memory_note && (
              <p className="mt-3 text-sm text-muted">{r.memory_note}</p>
            )}
          </div>
          <div className={`${RISK_TINT[r.scorecard.risk_score] ?? RISK_TINT.Medium} px-5 py-4 text-center min-w-[180px]`}>
            <div className="label">{isBattle ? 'Blended risk' : 'Risk score'}</div>
            <div className="mt-1 font-display text-3xl font-extrabold text-strong">{r.scorecard.risk_score}</div>
            <div className="mt-2 label">Composite {composite.toFixed(1)}/10</div>
          </div>
        </div>

        {!isBattle && (
          <div className="mt-6 grid gap-3 md:grid-cols-5">
            <ScorePill label="Economic" value={r.scorecard.economic_impact} tone="primary" />
            <ScorePill label="Social" value={r.scorecard.social_impact} tone="secondary" />
            <ScorePill label="Political" value={r.scorecard.political_feasibility} tone="primary" />
            <ScorePill label="Legal complexity" value={r.scorecard.legal_complexity} tone="neutral" />
            <ScorePill label="Environment" value={r.scorecard.environmental_impact} tone="tertiary" />
          </div>
        )}
      </section>

      {/* ============ BATTLE MODE ============ */}
      {isBattle && (
        <>
          {r.battle_verdict && (
            <BattleVerdict verdict={r.battle_verdict} policyA={r.policyText} policyB={r.policyBText} />
          )}

          {/* Round 1 — Independent scoring */}
          <section className="space-y-5">
            <RoundHeader
              round={1}
              title="Independent scoring"
              subtitle="All 8 domain agents rate both policies in isolation — no debate yet."
            />
            {r.scorecard_a && r.scorecard_b && (
              <BattleScorecard
                scorecardA={r.scorecard_a}
                scorecardB={r.scorecard_b}
                policyA={r.policyText}
                policyB={r.policyBText}
              />
            )}
            <div className="grid gap-4 md:grid-cols-2">
              {r.agents.map((a, i) => (
                <AgentCard key={`${a.agent}-${i}`} agent={a} battle />
              ))}
            </div>
          </section>

          {/* Round 2 — Live debate */}
          {r.battle.length > 0 && (
            <section className="space-y-5">
              <RoundHeader
                round={2}
                title="Live debate"
                subtitle="Agents argue across three phases: opening · rebuttal · closing."
              />
              <BattleTranscript turns={r.battle} />
            </section>
          )}

          {/* Round 3 — Judges crown the winner */}
          <section className="space-y-5">
            <RoundHeader
              round={3}
              title="Three judges crown the winner"
              subtitle="Optimistic, Pessimistic and Pragmatic judges weigh the evidence."
            />
            <JudgesPanel judges={r.judges ?? []} />
          </section>
        </>
      )}

      {/* Critic verdict (cross-cutting risk read) */}
      {r.critic_summary && (
        <section className="card p-6" style={{ borderColor: '#fecaca', background: 'linear-gradient(180deg,#fef2f2,#ffffff 70%)' }}>
          <div className="label" style={{ color: '#b91c1c' }}>Critic verdict</div>
          <p className="mt-2 text-base leading-relaxed text-strong">{r.critic_summary}</p>
        </section>
      )}

      {/* ============ SINGLE MODE ============ */}
      {!isBattle && (
        <section>
          <h2 className="font-display text-2xl md:text-3xl font-extrabold text-strong">Agent analysis</h2>
          <p className="mt-1 text-sm text-muted">
            8 specialised agents reason in parallel from RAG context and MCP outputs.
          </p>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {r.agents.map((a, i) => (
              <AgentCard key={`${a.agent}-${i}`} agent={a} />
            ))}
          </div>
        </section>
      )}

      {/* Future simulator — 5-year horizon */}
      <section>
        <h2 className="font-display text-2xl md:text-3xl font-extrabold text-strong">
          {isBattle ? 'Future simulator · 5-year comparison' : 'Future simulator · 5-year projection'}
        </h2>
        <p className="mt-1 text-sm text-muted">
          {isBattle
            ? 'Directional outcomes for each policy, year by year.'
            : 'Directional outcomes year by year.'}
        </p>
        <div className="mt-4">
          {hasFutureCompare ? (
            <FutureCompare futureA={r.future_a!} futureB={r.future_b!} />
          ) : (
            <FutureTimeline snapshots={r.future} />
          )}
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl md:text-3xl font-extrabold text-strong">RAG context (Qdrant)</h2>
        <p className="mt-1 text-sm text-muted">Top-ranked chunks retrieved from the vector DB.</p>
        <div className="mt-4"><SourcesList sources={r.sources} /></div>
      </section>

      <section>
        <h2 className="font-display text-2xl md:text-3xl font-extrabold text-strong">MCP adapter outputs</h2>
        <p className="mt-1 text-sm text-muted">External tool calls (search, PDF, stats, gov data, news, viz).</p>
        <div className="mt-4"><McpPanel insights={r.mcp_insights} /></div>
      </section>

      {!hasJudges && isBattle && (
        <p className="text-xs text-muted">
          (Older reports created before the 3-judge round won&apos;t show Round 3 — re-run the battle to see it.)
        </p>
      )}
    </div>
  );
}
