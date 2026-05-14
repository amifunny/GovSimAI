import type { RagSource } from '@/lib/types';

export function SourcesList({ sources }: { sources: RagSource[] }) {
  if (!sources?.length) return null;
  return (
    <div className="card p-5">
      <div className="label">Retrieved context · Qdrant</div>
      <ul className="mt-3 grid gap-3 md:grid-cols-2">
        {sources.map((s, i) => (
          <li
            key={`${s.title}-${i}`}
            className="card-soft p-3"
          >
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-display font-semibold text-sm text-strong">{s.title}</span>
              {typeof s.score === 'number' && (
                <span className="chip">score {s.score.toFixed(2)}</span>
              )}
            </div>
            <p className="mt-1.5 text-sm leading-snug text-neutral-700">{s.excerpt}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
