import type { JudgeVerdict } from '@/lib/types';

type Persona = JudgeVerdict['persona'];

const STYLES: Record<Persona, { bg: string; fg: string; ring: string; tint: string; tagline: string }> = {
  Optimistic: {
    bg: '#fffbeb',
    fg: '#92400e',
    ring: '#fde68a',
    tint: 'card-tinted-secondary',
    tagline: 'Weights upside, growth and equity gains.',
  },
  Pessimistic: {
    bg: '#fef2f2',
    fg: '#b91c1c',
    ring: '#fecaca',
    tint: 'card',
    tagline: 'Weights downside, fiscal and execution risk.',
  },
  Pragmatic: {
    bg: '#eef2ff',
    fg: '#4338ca',
    ring: '#c7d2fe',
    tint: 'card-tinted-primary',
    tagline: 'Weights feasibility, sequencing and cost-benefit.',
  },
};

function JudgeIcon({ persona, color }: { persona: Persona; color: string }) {
  const common = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: color,
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  };
  if (persona === 'Optimistic') {
    // Sun
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2V4M12 20V22M2 12H4M20 12H22M5 5L6.5 6.5M17.5 17.5L19 19M5 19L6.5 17.5M17.5 6.5L19 5" />
      </svg>
    );
  }
  if (persona === 'Pessimistic') {
    // Cloud with rain
    return (
      <svg {...common}>
        <path d="M6 14H17a3 3 0 0 0 0-6 5 5 0 0 0-9.6 1A3 3 0 0 0 6 14Z" />
        <path d="M9 17L8 20" />
        <path d="M13 17L12 20" />
        <path d="M17 17L16 20" />
      </svg>
    );
  }
  // Pragmatic — compass
  return (
    <svg {...common}>
      <circle cx="12" cy="12" r="9" />
      <path d="M14.5 9.5L11 13L9.5 14.5L13 11L14.5 9.5Z" fill={color} />
    </svg>
  );
}

function Bar({ value, accent }: { value: number; accent: string }) {
  const pct = Math.max(0, Math.min(100, (value / 10) * 100));
  return (
    <div className="bar mt-1.5">
      <span style={{ width: `${pct}%`, background: accent }} />
    </div>
  );
}

export function JudgesPanel({ judges }: { judges: JudgeVerdict[] }) {
  if (!judges?.length) {
    return (
      <div className="card p-5 text-sm text-muted">
        Judges have not deliberated for this battle yet.
      </div>
    );
  }

  const order: Persona[] = ['Optimistic', 'Pessimistic', 'Pragmatic'];
  const sorted = order
    .map((p) => judges.find((j) => j.persona === p))
    .filter((x): x is JudgeVerdict => !!x);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {sorted.map((j) => {
        const s = STYLES[j.persona];
        const winnerLabel =
          j.winner === 'A' ? 'Policy A' : j.winner === 'B' ? 'Policy B' : 'Tie';
        const winnerCls =
          j.winner === 'A' ? 'chip chip-primary' : j.winner === 'B' ? 'chip chip-tertiary' : 'chip';
        return (
          <article key={j.persona} className={`${s.tint} p-5 h-full flex flex-col`}>
            <header className="flex items-center gap-3">
              <span
                className="grid h-11 w-11 place-items-center rounded-2xl"
                style={{ background: 'white', border: `1px solid ${s.ring}`, color: s.fg }}
              >
                <JudgeIcon persona={j.persona} color={s.fg} />
              </span>
              <div className="min-w-0">
                <h3 className="font-display text-lg font-bold text-strong">
                  The {j.persona} Judge
                </h3>
                <p className="text-xs text-muted line-clamp-1">{s.tagline}</p>
              </div>
            </header>

            <div className="mt-4 grid grid-cols-2 gap-3">
              <div className="card p-3">
                <div className="flex items-baseline justify-between">
                  <span className="label text-primary-700">Policy A</span>
                  <span className="font-display text-xl font-extrabold text-primary-700">
                    {j.score_a.toFixed(1)}
                    <span className="text-xs text-primary-700/60">/10</span>
                  </span>
                </div>
                <Bar value={j.score_a} accent="#6366f1" />
              </div>
              <div className="card p-3">
                <div className="flex items-baseline justify-between">
                  <span className="label" style={{ color: '#047857' }}>Policy B</span>
                  <span className="font-display text-xl font-extrabold" style={{ color: '#047857' }}>
                    {j.score_b.toFixed(1)}
                    <span className="text-xs opacity-60">/10</span>
                  </span>
                </div>
                <Bar value={j.score_b} accent="#10b981" />
              </div>
            </div>

            <div className="mt-3 flex items-center justify-between rounded-xl border border-neutral-200 bg-white px-3 py-2">
              <span className="label">Verdict</span>
              <span className={winnerCls}>{winnerLabel}</span>
            </div>

            {j.key_argument && (
              <div className="mt-3">
                <div className="label">Decisive argument</div>
                <p className="mt-1 text-sm text-strong italic">&ldquo;{j.key_argument}&rdquo;</p>
              </div>
            )}

            {j.reasoning && (
              <p className="mt-3 text-sm leading-relaxed text-neutral-700">{j.reasoning}</p>
            )}
          </article>
        );
      })}
    </div>
  );
}
