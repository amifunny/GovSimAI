import { Nav } from '@/components/Nav';
import { Footer } from '@/components/Footer';
import { ReportView } from '@/components/ReportView';

export const metadata = {
  title: 'Report · GovSim AI',
};

export default async function ReportPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return (
    <main className="min-h-screen relative overflow-hidden">
      <div aria-hidden className="blob -left-32 top-10 bg-primary/15 no-print" />
      <div aria-hidden className="blob right-0 top-[40%] bg-secondary/15 no-print" />
      <Nav />
      <section className="wrap py-10 md:py-14">
        <ReportView id={id} />
      </section>
      <Footer />
    </main>
  );
}
