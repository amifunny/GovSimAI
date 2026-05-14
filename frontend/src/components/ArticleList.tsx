import type { Article } from '@/lib/types';

export function ArticleList({ articles }: { articles: Article[] }) {
  if (!articles?.length) return null;
  return (
    <div>
      <div className="label">Articles to read · Justification</div>
      <ul className="mt-2 space-y-1.5">
        {articles.map((a, i) => {
          const hasUrl = a.url && a.url.startsWith('http');
          const Tag = (hasUrl ? 'a' : 'div') as 'a' | 'div';
          const props: Record<string, unknown> = hasUrl
            ? { href: a.url, target: '_blank', rel: 'noopener noreferrer' }
            : {};
          return (
            <li key={`${a.title}-${i}`}>
              <Tag
                {...(props as React.HTMLAttributes<HTMLElement>)}
                className="card-soft block p-3 transition hover:border-primary-200 hover:bg-primary-50/40"
              >
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-sm font-medium text-strong line-clamp-1">{a.title}</span>
                  {hasUrl && (
                    <span className="text-[11px] font-semibold text-primary-700">
                      Open ↗
                    </span>
                  )}
                </div>
                {a.source && (
                  <div className="mt-0.5 text-[11px] text-muted">
                    {a.source}
                  </div>
                )}
              </Tag>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
