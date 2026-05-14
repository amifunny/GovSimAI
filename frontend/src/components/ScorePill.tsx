type Props = {
  label: string;
  value: number;
  max?: number;
  tone?: 'primary' | 'secondary' | 'tertiary' | 'neutral';
};

const TONE: Record<NonNullable<Props['tone']>, string> = {
  primary: 'card-tinted-primary',
  secondary: 'card-tinted-secondary',
  tertiary: 'card-tinted-tertiary',
  neutral: 'card',
};

export function ScorePill({ label, value, max = 10, tone = 'neutral' }: Props) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div className={`${TONE[tone]} p-4`}>
      <div className="flex items-baseline justify-between gap-2">
        <span className="label">{label}</span>
        <span className="font-display text-2xl font-bold text-strong">
          {value.toFixed(1)}
          <span className="text-neutral-400 text-sm font-normal">/{max}</span>
        </span>
      </div>
      <div className="mt-3 bar">
        <span style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
