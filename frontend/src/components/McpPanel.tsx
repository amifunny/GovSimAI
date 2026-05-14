import type { McpInsight } from '@/lib/types';

const TOOL_LABELS: Record<string, string> = {
  search: 'Search',
  pdf: 'PDF',
  statistics: 'Statistics',
  government_dataset: 'Gov dataset',
  news: 'News',
  visualization: 'Visualization',
};

const TOOL_TINT: Record<string, string> = {
  search: 'card-tinted-primary',
  pdf: 'card-tinted-secondary',
  statistics: 'card-tinted-tertiary',
  government_dataset: 'card-tinted-primary',
  news: 'card-tinted-secondary',
  visualization: 'card-tinted-tertiary',
};

export function McpPanel({ insights }: { insights: McpInsight[] }) {
  if (!insights?.length) return null;
  return (
    <div className="card p-5">
      <div className="flex items-baseline justify-between gap-2">
        <div className="label">MCP tool adapters</div>
        <span className="chip">{insights.length} ran</span>
      </div>
      <ul className="mt-3 grid gap-3 md:grid-cols-3">
        {insights.map((m, idx) => (
          <li key={`${m.tool}-${idx}`} className={`${TOOL_TINT[m.tool] ?? 'card-soft'} p-3`}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="font-display font-semibold text-sm text-strong">
                {TOOL_LABELS[m.tool] ?? m.tool}
              </span>
              <span
                className={
                  m.status === 'ok'
                    ? 'chip chip-tertiary'
                    : m.status === 'error'
                      ? 'chip chip-coral'
                      : 'chip'
                }
              >
                {m.status}
              </span>
            </div>
            <p className="mt-1.5 text-sm leading-snug text-neutral-700">{m.summary}</p>
            <details className="mt-2">
              <summary className="cursor-pointer label hover:text-neutral-900">show data</summary>
              <pre className="mt-2 overflow-x-auto rounded-lg bg-neutral-900 p-2 font-mono text-[11px] text-neutral-100">
                {JSON.stringify(m.data, null, 2)}
              </pre>
            </details>
          </li>
        ))}
      </ul>
    </div>
  );
}
