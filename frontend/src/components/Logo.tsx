import Link from 'next/link';

function IconGov({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 10L12 4L21 10" />
      <path d="M5 10V19" />
      <path d="M9 10V19" />
      <path d="M15 10V19" />
      <path d="M19 10V19" />
      <path d="M3 19H21" />
    </svg>
  );
}

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const cls =
    size === 'sm'
      ? 'text-lg md:text-xl'
      : size === 'lg'
        ? 'text-3xl md:text-4xl'
        : 'text-xl md:text-2xl';
  return (
    <Link href="/" className="inline-flex items-center gap-2.5 select-none">
      <span className="relative inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-primary text-white shadow-[0_8px_18px_rgba(99,102,241,0.32)]">
        <IconGov />
        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-secondary border-2 border-white" />
      </span>
      <span className={`font-display font-extrabold leading-none ${cls} text-neutral-900`}>
        GovSim<span className="text-primary">AI</span>
      </span>
    </Link>
  );
}
