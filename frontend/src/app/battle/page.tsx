import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { BattleLab } from '@/components/BattleLab';

export const metadata = {
  title: 'Battle Mode · GovSim AI',
};

export default function BattlePage() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      <div aria-hidden className="blob -left-24 top-20 bg-primary/25" />
      <div aria-hidden className="blob right-0 top-[60%] bg-secondary/25" />
      <Nav />
      <section className="wrap py-10 md:py-14">
        <span className="chip chip-secondary">Battle mode</span>
        <h1 className="mt-4 font-display text-4xl md:text-6xl font-extrabold leading-tight text-strong">
          Pit two policies head-to-head
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          All 8 agents rate <span className="text-strong font-semibold">both</span> policies independently,
          stage a live 3-round debate, attach articles for justification, and a winner is crowned.
        </p>
        <BattleLab />
      </section>
      <Footer />
    </main>
  );
}
