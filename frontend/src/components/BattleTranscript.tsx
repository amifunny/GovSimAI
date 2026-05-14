import type { BattleTurn } from '@/lib/types';
import { AgentBadge } from './AgentBadge';

const SUBROUND_NAMES: Record<number, string> = {
  1: 'Opening argument',
  2: 'Rebuttal',
  3: 'Closing pitch',
};

export function BattleTranscript({ turns }: { turns: BattleTurn[] }) {
  if (!turns?.length) return null;

  // Group turns by their sub-round so we can render an explicit header per phase.
  const groups = new Map<number, BattleTurn[]>();
  for (const t of turns) {
    const r = Number(t.round) || 1;
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r)!.push(t);
  }
  const sortedRounds = Array.from(groups.keys()).sort((a, b) => a - b);

  return (
    <div className="space-y-6">
      {sortedRounds.map((r) => (
        <div key={r} className="card p-5">
          <div className="flex items-center justify-between gap-3">
            <div className="label">
              Phase {r} · {SUBROUND_NAMES[r] ?? 'Argument'}
            </div>
            <span className="chip">{groups.get(r)!.length} turns</span>
          </div>
          <div className="mt-4 space-y-3">
            {groups.get(r)!.map((t, idx) => {
              const left = t.policy_side !== 'B';
              const sideLabel =
                t.policy_side === 'A' ? 'Policy A' : t.policy_side === 'B' ? 'Policy B' : 'Judge';
              const tint =
                t.policy_side === 'A'
                  ? 'card-tinted-primary'
                  : t.policy_side === 'B'
                    ? 'card-tinted-tertiary'
                    : 'card-tinted-secondary';
              return (
                <div
                  key={`${r}-${idx}`}
                  className={`flex ${left ? 'justify-start' : 'justify-end'}`}
                >
                  <div className={`${tint} max-w-[88%] p-4 flex gap-3 ${left ? '' : 'flex-row-reverse'}`}>
                    <AgentBadge title={t.speaker} size="sm" />
                    <div className={left ? 'text-left' : 'text-right'}>
                      <div className="label">
                        {t.speaker} · {sideLabel}
                      </div>
                      <p className="mt-1.5 text-sm leading-relaxed text-strong">{t.message}</p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
