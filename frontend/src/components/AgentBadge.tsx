import type { ReactNode } from 'react';

export const AGENT_COLORS: Record<string, { bg: string; fg: string; ring: string }> = {
  'Economist Agent':     { bg: '#eef2ff', fg: '#4338ca', ring: '#c7d2fe' },
  'Social Agent':        { bg: '#fffbeb', fg: '#92400e', ring: '#fde68a' },
  'Political Agent':     { bg: '#f5f3ff', fg: '#6d28d9', ring: '#ddd6fe' },
  'Legal Agent':         { bg: '#ecfdf5', fg: '#047857', ring: '#a7f3d0' },
  'Environmental Agent': { bg: '#f0fdf4', fg: '#15803d', ring: '#bbf7d0' },
  'Historian Agent':     { bg: '#fefce8', fg: '#a16207', ring: '#fef08a' },
  'Critic Agent':        { bg: '#fef2f2', fg: '#b91c1c', ring: '#fecaca' },
  'Citizen Agent':       { bg: '#ecfeff', fg: '#0e7490', ring: '#a5f3fc' },
};

/* ---------- Inline icon set (stroke style, currentColor) ---------- */

function Svg({ children, size }: { children: ReactNode; size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  );
}

const ICONS: Record<string, (size: number) => ReactNode> = {
  // Economist — line chart trending up
  'Economist Agent': (s) => (
    <Svg size={s}>
      <path d="M3 17L9 11L13 15L21 7" />
      <path d="M15 7H21V13" />
    </Svg>
  ),
  // Social — three people
  'Social Agent': (s) => (
    <Svg size={s}>
      <circle cx="9" cy="8" r="3" />
      <circle cx="17" cy="9" r="2.2" />
      <path d="M3 20c0-3 3-5 6-5s6 2 6 5" />
      <path d="M15 20c0-2.2 1.8-4 4-4" />
    </Svg>
  ),
  // Political — government building / columns
  'Political Agent': (s) => (
    <Svg size={s}>
      <path d="M3 10L12 4L21 10" />
      <path d="M5 10V19" />
      <path d="M9 10V19" />
      <path d="M15 10V19" />
      <path d="M19 10V19" />
      <path d="M3 19H21" />
    </Svg>
  ),
  // Legal — scales of justice
  'Legal Agent': (s) => (
    <Svg size={s}>
      <path d="M12 4V20" />
      <path d="M6 20H18" />
      <path d="M5 7H19" />
      <path d="M6 7L3 13H9L6 7Z" />
      <path d="M18 7L15 13H21L18 7Z" />
    </Svg>
  ),
  // Environmental — tree
  'Environmental Agent': (s) => (
    <Svg size={s}>
      <path d="M12 21V14" />
      <path d="M12 14C8 14 6 11 6 8.5C6 6 8 4 12 4C16 4 18 6 18 8.5C18 11 16 14 12 14Z" />
      <path d="M12 9C10.5 9 9.5 10 9.5 11.5" />
    </Svg>
  ),
  // Historian — open book
  'Historian Agent': (s) => (
    <Svg size={s}>
      <path d="M4 5C4 5 6 4 9 4C11.2 4 12 5 12 5" />
      <path d="M20 5C20 5 18 4 15 4C12.8 4 12 5 12 5" />
      <path d="M12 5V20" />
      <path d="M4 5V19C4 19 6 18 9 18C11.2 18 12 19 12 19" />
      <path d="M20 5V19C20 19 18 18 15 18C12.8 18 12 19 12 19" />
    </Svg>
  ),
  // Critic — magnifying glass
  'Critic Agent': (s) => (
    <Svg size={s}>
      <circle cx="11" cy="11" r="6" />
      <path d="M16 16L21 21" />
      <path d="M8.5 11H13.5" />
    </Svg>
  ),
  // Citizen — speech bubble
  'Citizen Agent': (s) => (
    <Svg size={s}>
      <path d="M4 6C4 4.9 4.9 4 6 4H18C19.1 4 20 4.9 20 6V14C20 15.1 19.1 16 18 16H10L6 20V16H6C4.9 16 4 15.1 4 14V6Z" />
      <circle cx="9" cy="10" r="0.8" fill="currentColor" />
      <circle cx="12" cy="10" r="0.8" fill="currentColor" />
      <circle cx="15" cy="10" r="0.8" fill="currentColor" />
    </Svg>
  ),
};

function iconFor(title: string, size: number): ReactNode {
  const fn = ICONS[title];
  if (fn) return fn(size);
  return <span className="font-display font-bold">{title.charAt(0)}</span>;
}

type Props = {
  title: string;
  size?: 'sm' | 'md' | 'lg';
};

export function AgentBadge({ title, size = 'md' }: Props) {
  const c = AGENT_COLORS[title] ?? AGENT_COLORS['Economist Agent'];
  const dims =
    size === 'sm' ? { box: 'h-7 w-7 rounded-lg', icon: 14 } :
    size === 'lg' ? { box: 'h-11 w-11 rounded-2xl', icon: 22 } :
                    { box: 'h-9 w-9 rounded-xl', icon: 18 };
  return (
    <span
      className={`grid place-items-center ${dims.box}`}
      style={{ background: c.bg, color: c.fg, border: `1px solid ${c.ring}` }}
      aria-label={title}
      title={title}
    >
      {iconFor(title, dims.icon)}
    </span>
  );
}
