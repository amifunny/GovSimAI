import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { PolicyLab } from '@/components/PolicyLab';

export const metadata = {
  title: 'Policy Lab · GovSim AI',
};

export default function LabPage() {
  return (
    <main className="min-h-screen relative overflow-hidden">
      <div aria-hidden className="blob -left-32 top-32 bg-primary/25" />
      <div aria-hidden className="blob right-0 top-[60%] bg-tertiary/20" />
      <Nav />
      <section className="wrap py-10 md:py-14">
        <span className="chip chip-primary">Policy lab</span>
        <h1 className="mt-4 font-display text-4xl md:text-6xl font-extrabold leading-tight text-strong">
          Run a multi-agent simulation
        </h1>
        <p className="mt-3 max-w-2xl text-muted">
          Paste your policy proposal, upload supporting PDFs, and let 8 agents reason in parallel
          with RAG context from Qdrant and outputs from MCP tool adapters.
        </p>
        <PolicyLab />
      </section>
      <Footer />
    </main>
  );
}
