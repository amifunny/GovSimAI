import type { BattleVerdict as BattleVerdictType } from '@/lib/types';

type Props = {
  verdict: BattleVerdictType;
  policyA: string;
  policyB: string;
};

function WinnerCrown({ side }: { side: 'A' | 'B' | 'tie' }) {
  if (side === 'tie') {
    return (
      <span className="chip chip-secondary text-xs font-bold tracking-widest">
        TIE
      </span>
    );
  }
  return (
    <span className={side === 'A' ? 'chip chip-primary' : 'chip chip-tertiary'}>
      <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M5 16l-3-8 5 4 5-7 5 7 5-4-3 8H5zm0 2h14v2H5v-2z"/></svg>
      WINNER
    </span>
  );
}

export function BattleVerdict({ verdict, policyA, policyB }: Props) {
  const pctA = Math.max(0, Math.min(100, (verdict.score_a / 10) * 100));
  const pctB = Math.max(0, Math.min(100, (verdict.score_b / 10) * 100));
  return (
    <section className="card-lifted p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="label">Battle verdict</div>
          <h2 className="mt-1 font-display text-2xl font-extrabold text-strong md:text-3xl">
            {verdict.winner === 'tie' ? 'The agents called it a tie' : `Policy ${verdict.winner} wins`}
          </h2>
        </div>
        <div className="flex gap-2">
          <span className="chip">Avg A {verdict.score_a.toFixed(1)}/10</span>
          <span className="chip">Avg B {verdict.score_b.toFixed(1)}/10</span>
        </div>
      </div>

      <p className="mt-4 text-sm text-muted">{verdict.reason}</p>

      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <div className={`card-tinted-primary p-5 ${verdict.winner === 'A' ? 'ring-2 ring-primary' : ''}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="label text-primary-700">Policy A</div>
              <p className="mt-1 font-display text-base font-semibold text-strong line-clamp-3">
                {policyA || '—'}
              </p>
            </div>
            {verdict.winner === 'A' && <WinnerCrown side="A" />}
          </div>
          <div className="mt-4 flex items-end gap-3">
            <div className="font-display text-4xl font-extrabold text-primary-700">
              {verdict.score_a.toFixed(1)}
              <span className="text-base text-primary-700/60">/10</span>
            </div>
            <div className="flex-1 bar">
              <span style={{ width: `${pctA}%`, background: '#6366f1' }} />
            </div>
          </div>
        </div>

        <div className={`card-tinted-tertiary p-5 ${verdict.winner === 'B' ? 'ring-2 ring-emerald-500' : ''}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="label" style={{ color: '#047857' }}>Policy B</div>
              <p className="mt-1 font-display text-base font-semibold text-strong line-clamp-3">
                {policyB || '—'}
              </p>
            </div>
            {verdict.winner === 'B' && <WinnerCrown side="B" />}
          </div>
          <div className="mt-4 flex items-end gap-3">
            <div className="font-display text-4xl font-extrabold" style={{ color: '#047857' }}>
              {verdict.score_b.toFixed(1)}
              <span className="text-base opacity-60">/10</span>
            </div>
            <div className="flex-1 bar">
              <span style={{ width: `${pctB}%`, background: '#10b981' }} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
