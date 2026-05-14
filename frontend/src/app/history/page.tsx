import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { HistoryList } from '@/components/HistoryList';

export const metadata = {
  title: 'History · GovSim AI',
};

export default function HistoryPage() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      <div aria-hidden className="blob -left-24 top-10 bg-primary/20" />
      <div aria-hidden className="blob right-0 top-[60%] bg-tertiary/20" />
      <Nav />
      <section className="wrap py-10 md:py-14">
        <span className="chip chip-tertiary">History</span>
        <h1 className="mt-4 font-display text-4xl md:text-6xl font-extrabold leading-tight text-strong">
          Past simulations &amp; battles
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          Reports are stored locally in this browser — print, share, or delete any time.
        </p>
        <HistoryList />
      </section>
      <Footer />
    </main>
  );
}
