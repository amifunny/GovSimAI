import type { FutureSnapshot } from '@/lib/types';

function pct(n: number) {
  const prefix = n > 0 ? '+' : '';
  return `${prefix}${n.toFixed(1)}%`;
}

function tone(n: number) {
  if (n > 0) return 'text-emerald-700';
  if (n < 0) return 'text-red-700';
  return 'text-neutral-500';
}

/* -------- single-policy 5-card timeline (used in single mode) -------- */

export function FutureTimeline({ snapshots }: { snapshots: FutureSnapshot[] }) {
  if (!snapshots?.length) return null;
  const tints = [
    'card-tinted-primary',
    'card-tinted-secondary',
    'card-tinted-tertiary',
    'card-tinted-primary',
    'card-tinted-secondary',
  ];
  return (
    <div className="grid gap-3 md:grid-cols-5 sm:grid-cols-2">
      {snapshots.map((s, i) => (
        <div key={s.year} className={`${tints[i % tints.length]} p-4`}>
          <div className="flex items-baseline justify-between">
            <div className="font-display text-2xl font-extrabold">{s.year}</div>
            <span className="chip">Snapshot</span>
          </div>
          <ul className="mt-3 space-y-1.5 text-sm">
            <li className="flex items-center justify-between">
              <span className="text-muted">GDP</span>
              <span className={`font-semibold ${tone(s.gdp_delta_pct)}`}>{pct(s.gdp_delta_pct)}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-muted">Startups</span>
              <span className={`font-semibold ${tone(s.startup_delta_pct)}`}>{pct(s.startup_delta_pct)}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-muted">Inflation</span>
              <span className={`font-semibold ${tone(-s.inflation_delta_pct)}`}>{pct(s.inflation_delta_pct)}</span>
            </li>
            <li className="flex items-center justify-between">
              <span className="text-muted">Employment</span>
              <span className={`font-semibold ${tone(s.employment_delta_pct)}`}>{pct(s.employment_delta_pct)}</span>
            </li>
          </ul>
          <p className="mt-3 text-xs leading-snug text-neutral-700 line-clamp-3">{s.note}</p>
        </div>
      ))}
    </div>
  );
}

/* -------- per-policy 5-year comparison (battle mode) -------- */

type Side = 'A' | 'B' | 'tie';

const METRICS: { key: keyof Omit<FutureSnapshot, 'year' | 'note'>; label: string; invert?: boolean }[] = [
  { key: 'gdp_delta_pct',        label: 'GDP' },
  { key: 'startup_delta_pct',    label: 'Startups' },
  { key: 'inflation_delta_pct',  label: 'Inflation', invert: true },
  { key: 'employment_delta_pct', label: 'Employment' },
];

function compare(a: number, b: number, invert?: boolean): Side {
  if (Math.abs(a - b) < 0.15) return 'tie';
  if (invert) return a < b ? 'A' : 'B';
  return a > b ? 'A' : 'B';
}

function MetricRow({ label, a, b, invert }: { label: string; a: number; b: number; invert?: boolean }) {
  const winner = compare(a, b, invert);
  return (
    <li className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-xs">
      <span
        className={`text-right font-semibold ${tone(invert ? -a : a)} ${winner === 'A' ? 'underline decoration-primary decoration-2 underline-offset-2' : ''}`}
      >
        {pct(a)}
      </span>
      <span className="text-muted text-center min-w-[78px]">{label}</span>
      <span
        className={`font-semibold ${tone(invert ? -b : b)} ${winner === 'B' ? 'underline decoration-emerald-500 decoration-2 underline-offset-2' : ''}`}
      >
        {pct(b)}
      </span>
    </li>
  );
}

type CompareProps = {
  futureA: FutureSnapshot[];
  futureB: FutureSnapshot[];
};

export function FutureCompare({ futureA, futureB }: CompareProps) {
  if (!futureA?.length || !futureB?.length) return null;

  // Align by year (both arrays should have matching years; fall back to index).
  const years = futureA.map((s) => s.year);
  const byYearA = new Map(futureA.map((s) => [s.year, s]));
  const byYearB = new Map(futureB.map((s) => [s.year, s]));

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <span className="chip chip-primary">Policy A</span>
        <span className="text-muted text-xs">vs</span>
        <span className="chip chip-tertiary">Policy B</span>
        <span className="ml-auto text-xs text-muted">
          Underlined number = winner for that year + metric.
        </span>
      </div>

      <div className="grid gap-3 md:grid-cols-5 sm:grid-cols-2">
        {years.map((y) => {
          const a = byYearA.get(y);
          const b = byYearB.get(y);
          if (!a || !b) return null;
          return (
            <div key={y} className="card p-4">
              <div className="flex items-baseline justify-between">
                <div className="font-display text-2xl font-extrabold">{y}</div>
                <span className="chip">Year</span>
              </div>
              <ul className="mt-3 space-y-1.5">
                {METRICS.map((m) => (
                  <MetricRow
                    key={m.key}
                    label={m.label}
                    a={a[m.key]}
                    b={b[m.key]}
                    invert={m.invert}
                  />
                ))}
              </ul>
              <div className="mt-3 space-y-1.5 text-[11px] leading-snug">
                <div>
                  <span className="font-semibold text-primary-700">A: </span>
                  <span className="text-neutral-700">{a.note}</span>
                </div>
                <div>
                  <span className="font-semibold" style={{ color: '#047857' }}>B: </span>
                  <span className="text-neutral-700">{b.note}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
