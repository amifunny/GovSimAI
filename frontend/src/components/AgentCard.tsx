import type { AgentVerdict } from '@/lib/types';
import { AgentBadge } from './AgentBadge';
import { ArticleList } from './ArticleList';

const STANCE_CHIP: Record<string, string> = {
  Supportive: 'chip chip-tertiary',
  Skeptical: 'chip chip-secondary',
  Mixed: 'chip chip-primary',
  Opposed: 'chip chip-coral',
  Unknown: 'chip',
};

type Props = {
  agent: AgentVerdict;
  battle?: boolean;
};

function MiniBar({ value, accent }: { value: number; accent: string }) {
  const pct = Math.max(0, Math.min(100, (value / 10) * 100));
  return (
    <div className="bar mt-1.5">
      <span style={{ width: `${pct}%`, background: accent }} />
    </div>
  );
}

export function AgentCard({ agent, battle = false }: Props) {
  const stanceCls = STANCE_CHIP[agent.stance] ?? STANCE_CHIP.Mixed;
  const isBattle = battle && (typeof agent.score_a === 'number' || typeof agent.score_b === 'number');

  return (
    <article className="card p-5 flex flex-col gap-4 h-full">
      <header className="flex items-start gap-3">
        <AgentBadge title={agent.agent} size="lg" />
        <div className="flex-1">
          <h3 className="font-display text-lg font-bold text-strong leading-tight">
            {agent.agent}
          </h3>
          <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
            <span className={stanceCls}>{agent.stance}</span>
            {!isBattle && (
              <>
                <span className="chip">{agent.score.toFixed(1)}/10</span>
                <span className="chip">{agent.confidence}% conf</span>
              </>
            )}
            {isBattle && (
              <span className="chip">{agent.confidence}% conf</span>
            )}
          </div>
        </div>
      </header>

      <p className="text-sm leading-relaxed text-neutral-700">{agent.summary}</p>

      {isBattle && (
        <div className="grid grid-cols-2 gap-3">
          <div className="card-tinted-primary p-3">
            <div className="flex items-baseline justify-between">
              <span className="label text-primary-700">Policy A</span>
              <span className="font-display text-xl font-bold text-primary-700">
                {(agent.score_a ?? 0).toFixed(1)}<span className="text-xs text-primary-700/70">/10</span>
              </span>
            </div>
            <MiniBar value={agent.score_a ?? 0} accent="#6366f1" />
            {agent.rationale_a && (
              <p className="mt-2 text-xs text-neutral-700 line-clamp-3">{agent.rationale_a}</p>
            )}
          </div>
          <div className="card-tinted-tertiary p-3">
            <div className="flex items-baseline justify-between">
              <span className="label" style={{ color: '#047857' }}>Policy B</span>
              <span className="font-display text-xl font-bold" style={{ color: '#047857' }}>
                {(agent.score_b ?? 0).toFixed(1)}<span className="text-xs opacity-70">/10</span>
              </span>
            </div>
            <MiniBar value={agent.score_b ?? 0} accent="#10b981" />
            {agent.rationale_b && (
              <p className="mt-2 text-xs text-neutral-700 line-clamp-3">{agent.rationale_b}</p>
            )}
          </div>
          <div className="col-span-2 flex items-center justify-between rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-2">
            <span className="label">Verdict</span>
            <span className={
              agent.winner === 'A'
                ? 'chip chip-primary'
                : agent.winner === 'B'
                  ? 'chip chip-tertiary'
                  : 'chip'
            }>
              {agent.winner === 'A' ? 'Policy A wins' : agent.winner === 'B' ? 'Policy B wins' : 'Tie'}
            </span>
          </div>
        </div>
      )}

      {agent.reactions && agent.reactions.length > 0 && (
        <ul className="mt-1 grid gap-2 text-xs">
          {agent.reactions.map((r) => (
            <li
              key={r.persona}
              className="rounded-xl border border-neutral-200 bg-neutral-50 p-2.5"
            >
              <div className="flex items-center justify-between">
                <span className="label">{r.persona}</span>
                <span
                  className={
                    r.sentiment === 'positive'
                      ? 'chip chip-tertiary'
                      : r.sentiment === 'negative'
                        ? 'chip chip-coral'
                        : 'chip'
                  }
                >
                  {r.sentiment}
                </span>
              </div>
              <div className="mt-1.5 text-neutral-700">{r.reaction}</div>
            </li>
          ))}
        </ul>
      )}

      {agent.articles?.length > 0 && <ArticleList articles={agent.articles} />}

      {agent.citations?.length > 0 && (
        <ul className="mt-auto flex flex-wrap gap-1.5 pt-1">
          {agent.citations.map((c, i) => (
            <li key={i} className="chip text-[10px]">
              {c}
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
