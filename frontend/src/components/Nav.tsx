import Link from 'next/link';
import { Logo } from './Logo';

export function Nav() {
  return (
    <header className="sticky top-0 z-30 backdrop-blur-md bg-[rgba(238,240,250,0.78)] border-b border-neutral-200/70">
      <div className="wrap flex items-center justify-between py-4">
        <Logo />
        <nav className="hidden md:flex items-center gap-1.5">
          <Link href="/lab" className="btn btn-ghost btn-sm">Policy lab</Link>
          <Link href="/battle" className="btn btn-ghost btn-sm">Battle mode</Link>
          <Link href="/history" className="btn btn-ghost btn-sm">History</Link>
        </nav>
        
      </div>
    </header>
  );
}
