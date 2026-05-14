import type { Scorecard } from '@/lib/types';

type Dim = {
  key: keyof Omit<Scorecard, 'risk_score'>;
  label: string;
  // For most dimensions higher = better. Legal complexity is inverted: lower = better.
  invert?: boolean;
  hint: string;
};

const DIMS: Dim[] = [
  { key: 'economic_impact',      label: 'Economic',        hint: 'GDP, jobs, fiscal health.' },
  { key: 'social_impact',        label: 'Social',          hint: 'Equity, cohesion, welfare.' },
  { key: 'political_feasibility', label: 'Political',       hint: 'Federal & coalition feasibility.' },
  { key: 'legal_complexity',     label: 'Legal complexity', invert: true, hint: 'Lower is better — less court/statute risk.' },
  { key: 'environmental_impact', label: 'Environment',     hint: 'Emissions, water, biodiversity.' },
];

function pickWinner(a: number, b: number, invert: boolean): 'A' | 'B' | 'tie' {
  const aBetter = invert ? a < b : a > b;
  const bBetter = invert ? b < a : b > a;
  if (Math.abs(a - b) < 0.15) return 'tie';
  if (aBetter) return 'A';
  if (bBetter) return 'B';
  return 'tie';
}

function Bar({ value, accent }: { value: number; accent: string }) {
  const pct = Math.max(0, Math.min(100, (value / 10) * 100));
  return (
    <div className="bar mt-1.5">
      <span style={{ width: `${pct}%`, background: accent }} />
    </div>
  );
}

type Props = {
  scorecardA: Scorecard;
  scorecardB: Scorecard;
  policyA: string;
  policyB: string;
};

export function BattleScorecard({ scorecardA, scorecardB, policyA, policyB }: Props) {
  // Per-dimension wins.
  const wins = { A: 0, B: 0, tie: 0 };
  for (const d of DIMS) {
    const w = pickWinner(scorecardA[d.key], scorecardB[d.key], !!d.invert);
    wins[w]++;
  }

  return (
    <section className="card-lifted p-6 md:p-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <div className="label">Policy scorecards · battle view</div>
          <h2 className="mt-1 font-display text-2xl md:text-3xl font-extrabold text-strong">
            Dimension-by-dimension
          </h2>
        </div>
        <div className="flex flex-wrap gap-1.5 text-xs">
          <span className="chip chip-primary">A wins {wins.A}</span>
          <span className="chip chip-tertiary">B wins {wins.B}</span>
          <span className="chip">Ties {wins.tie}</span>
        </div>
      </div>

      {/* Compact policy headers */}
      <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto_1fr] items-stretch">
        <div className="card-tinted-primary p-3 text-center">
          <div className="label text-primary-700">Policy A</div>
          <p className="mt-1 line-clamp-2 text-sm font-display font-semibold text-strong">{policyA || '—'}</p>
          <div className="mt-1 label">Risk · {scorecardA.risk_score}</div>
        </div>
        <div className="hidden md:flex items-center justify-center font-display text-xs font-bold text-neutral-400">
          vs
        </div>
        <div className="card-tinted-tertiary p-3 text-center">
          <div className="label" style={{ color: '#047857' }}>Policy B</div>
          <p className="mt-1 line-clamp-2 text-sm font-display font-semibold text-strong">{policyB || '—'}</p>
          <div className="mt-1 label">Risk · {scorecardB.risk_score}</div>
        </div>
      </div>

      {/* Per-dimension rows */}
      <ul className="mt-6 space-y-3">
        {DIMS.map((d) => {
          const a = scorecardA[d.key];
          const b = scorecardB[d.key];
          const winner = pickWinner(a, b, !!d.invert);
          return (
            <li
              key={d.key}
              className="card p-4 grid gap-3 md:grid-cols-[1fr_auto_1fr] md:items-center"
            >
              {/* Policy A side */}
              <div className={winner === 'A' ? 'rounded-xl px-3 py-2 bg-primary-50 ring-1 ring-primary-200' : 'px-3 py-2'}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="label">Policy A</span>
                  <span className="font-display text-xl font-extrabold text-primary-700">
                    {a.toFixed(1)}<span className="text-xs text-primary-700/60">/10</span>
                  </span>
                </div>
                <Bar value={a} accent="#6366f1" />
              </div>

              {/* Center column: dim name + verdict */}
              <div className="md:px-4 md:min-w-[200px] text-center">
                <div className="flex items-center justify-center gap-1.5">
                  <span className="font-display text-base font-bold text-strong">{d.label}</span>
                  {d.invert && (
                    <span
                      className="chip text-[9px] px-1.5 py-0"
                      title="For this dimension, lower is better."
                    >
                      ↓ better
                    </span>
                  )}
                </div>
                <p className="mt-1 text-[11px] text-muted line-clamp-1">{d.hint}</p>
                <div className="mt-1.5">
                  {winner === 'A' && <span className="chip chip-primary">A wins</span>}
                  {winner === 'B' && <span className="chip chip-tertiary">B wins</span>}
                  {winner === 'tie' && <span className="chip">tie</span>}
                </div>
              </div>

              {/* Policy B side */}
              <div className={winner === 'B' ? 'rounded-xl px-3 py-2 bg-emerald-50 ring-1 ring-emerald-200' : 'px-3 py-2'}>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="label" style={{ color: '#047857' }}>Policy B</span>
                  <span className="font-display text-xl font-extrabold" style={{ color: '#047857' }}>
                    {b.toFixed(1)}<span className="text-xs opacity-60">/10</span>
                  </span>
                </div>
                <Bar value={b} accent="#10b981" />
              </div>
            </li>
          );
        })}
      </ul>

      <p className="mt-5 text-xs text-muted">
        Per-policy scores are derived directly from each domain agent&apos;s rating for that policy.
        For <em className="text-strong">Legal complexity</em>, lower is better — fewer constitutional or statutory hurdles.
      </p>
    </section>
  );
}
