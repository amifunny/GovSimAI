type Props = {
  round: 1 | 2 | 3;
  title: string;
  subtitle: string;
};

const TONE: Record<1 | 2 | 3, { tint: string; chip: string; num: string }> = {
  1: { tint: 'card-tinted-primary',   chip: 'chip chip-primary',   num: 'text-primary-700' },
  2: { tint: 'card-tinted-secondary', chip: 'chip chip-secondary', num: 'text-amber-700' },
  3: { tint: 'card-tinted-tertiary',  chip: 'chip chip-tertiary',  num: 'text-emerald-700' },
};

export function RoundHeader({ round, title, subtitle }: Props) {
  const t = TONE[round];
  return (
    <div className={`${t.tint} p-5 md:p-6 flex items-center gap-5`}>
      <div className={`font-display font-extrabold text-4xl md:text-5xl ${t.num} leading-none`}>
        0{round}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={t.chip}>Round {round}</span>
          <span className="text-xs text-muted">of 3</span>
        </div>
        <h2 className="mt-1 font-display text-xl md:text-2xl font-extrabold text-strong leading-tight">
          {title}
        </h2>
        <p className="mt-0.5 text-sm text-muted">{subtitle}</p>
      </div>
      <div className="hidden md:flex items-center gap-1">
        {[1, 2, 3].map((n) => (
          <span
            key={n}
            className="h-2.5 w-2.5 rounded-full"
            style={{
              background:
                n < round ? '#10b981'
                : n === round ? '#6366f1'
                : '#e2e8f0',
            }}
          />
        ))}
      </div>
    </div>
  );
}
