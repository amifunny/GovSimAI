import Link from 'next/link';
import { Footer } from '@/components/Footer';
import { AgentBadge } from '@/components/AgentBadge';

function IconLab() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M4 20h16" />
      <path d="M9 4v6l-4 7a2 2 0 0 0 1.7 3h10.6a2 2 0 0 0 1.7-3l-4-7V4" />
      <path d="M8 14h8" />
    </svg>
  );
}

function IconBattle() {
  return (
    <svg width="40" height="40" viewBox="0 0 82 82" fill="none" aria-hidden>
      {/* left sword */}
      <path
        fill="#1F365F"
        d="M14 20V13L27 0H38L71 33L65 39L32 6H27L20 13V18L53 51L46 58L14 26V20Z"
      />
      <path
        fill="#B3BDD1"
        d="M26 13L60 47L54 53L20 19L26 13Z"
      />
      <path
        fill="#1F365F"
        d="M5 56C2 53 2 49 5 46L18 33L25 40L14 51L29 66L40 55L47 62L34 75C31 78 27 78 24 75L5 56Z"
      />

      {/* right sword */}
      <path
        fill="#1F365F"
        d="M68 20V13L55 0H44L11 33L17 39L50 6H55L62 13V18L29 51L36 58L68 26V20Z"
      />
      <path
        fill="#D8DDE8"
        d="M56 13L22 47L28 53L62 19L56 13Z"
      />
      <path
        fill="#1F365F"
        d="M77 56C80 53 80 49 77 46L64 33L57 40L68 51L53 66L42 55L35 62L48 75C51 78 55 78 58 75L77 56Z"
      />
    </svg>
  );
}

function IconHistory() {
  return (
    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
      <path d="M12 7v6l4 2" />
    </svg>
  );
}

function IconGov() {
  return (
    <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M3 10L12 4L21 10" />
      <path d="M5 10V19" />
      <path d="M9 10V19" />
      <path d="M15 10V19" />
      <path d="M19 10V19" />
      <path d="M3 19H21" />
    </svg>
  );
}

const HERO_CARDS = [
  {
    href: '/lab',
    title: 'Policy Lab',
    text: 'Analyze a single policy with multi-agent reasoning and evidence.',
    gradient: 'linear-gradient(145deg, #66dfc0 0%, #56c9a7 42%, #4ab893 100%)',
    color: '#0f766e',
    artA: 'rgba(255,255,255,0.35)',
    artB: 'rgba(15,23,42,0.18)',
    artC: 'rgba(16,185,129,0.35)',
    Icon: IconLab,
  },
  {
    href: '/battle',
    title: 'Battle mode',
    text: 'Compare two policies with rounds, judges, and a clear winner.',
    gradient: 'linear-gradient(145deg, #7ec2ff 0%, #5ca6e8 45%, #468dd1 100%)',
    color: '#1d4ed8',
    artA: 'rgba(255,255,255,0.35)',
    artB: 'rgba(37,99,235,0.2)',
    artC: 'rgba(14,116,219,0.35)',
    Icon: IconBattle,
  },
  {
    href: '/history',
    title: 'Past simulations',
    text: 'Open previous reports and review outcomes anytime.',
    gradient: 'linear-gradient(145deg, #ffd85e 0%, #ffc935 44%, #f7b500 100%)',
    color: '#b45309',
    artA: 'rgba(255,255,255,0.35)',
    artB: 'rgba(245,158,11,0.22)',
    artC: 'rgba(217,119,6,0.35)',
    Icon: IconHistory,
  },
];

const AGENTS = [
  { title: 'Economist Agent',     blurb: 'GDP, inflation, jobs, fiscal balance.' },
  { title: 'Social Agent',        blurb: 'Education, demographics, cohesion.' },
  { title: 'Political Agent',     blurb: 'Support, opposition, federal tensions.' },
  { title: 'Legal Agent',         blurb: 'Constitutional fit, rights, court risk.' },
  { title: 'Environmental Agent', blurb: 'Emissions, water, biodiversity.' },
  { title: 'Historian Agent',     blurb: 'Analogies, prior policy outcomes.' },
  { title: 'Critic Agent',        blurb: 'Weak assumptions, logic gaps.' },
  { title: 'Citizen Agent',       blurb: 'Students, middle class, MSMEs, rural, startups.' },
];

const PIPELINE = [
  { n: '01', t: 'Ingest',         b: 'Drop in policy text or upload PDFs, research, and budget docs.' },
  { n: '02', t: 'Embed + Qdrant', b: 'Chunks are embedded and persisted to a vector DB.' },
  { n: '03', t: 'MCP tools',      b: 'Search, PDF, stats, gov-dataset, news, viz adapters run in parallel.' },
  { n: '04', t: 'Agents reason',  b: '8 specialised agents debate the policy with shared context.' },
  { n: '05', t: 'Synthesise',     b: 'Final scorecard, risk, critic verdict, and a future timeline.' },
];

export default function HomePage() {
  return (
    <main className="relative overflow-hidden">
      <div aria-hidden className="blob -left-24 -top-24 bg-primary/25" />
      <div aria-hidden className="blob right-0 top-52 bg-secondary/20" />
      <div aria-hidden className="blob left-1/3 top-[80%] bg-tertiary/25" />

      <section className="wrap py-14 md:py-20">
        <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-3xl border border-neutral-200 bg-white/80 text-primary shadow-[0_10px_28px_rgba(15,23,42,0.12)]">
          <IconGov />
        </div>
        <h1 className="text-center font-display text-5xl md:text-7xl font-extrabold text-strong">
          GovSim<span style={{ color: '#6366F1' }}>AI</span>
        </h1>
        <p className="mx-auto mt-3 max-w-2xl text-center text-base md:text-lg text-neutral-600">
          Stress test your policy with multi agents.
        </p>
        <div className="mt-10 grid gap-5 md:grid-cols-3">
          {HERO_CARDS.map(({ href, title, text, gradient, color, artA, artB, artC, Icon }) => (
            <Link
              key={title}
              href={href}
              className="relative block overflow-hidden rounded-3xl border border-neutral-900/10 p-8 text-center transition hover:-translate-y-0.5 hover:shadow-[0_18px_40px_rgba(15,23,42,0.16)]"
              style={{ background: gradient }}
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -left-8 -top-8 h-28 w-28 rounded-full"
                style={{ background: artA }}
              />
              <span
                aria-hidden
                className="pointer-events-none absolute -right-10 top-6 h-24 w-24 rounded-full"
                style={{ background: artB }}
              />
              <span
                aria-hidden
                className="pointer-events-none absolute bottom-0 right-10 h-14 w-40 rounded-t-full"
                style={{ background: artC }}
              />
              <span
                aria-hidden
                className="pointer-events-none absolute left-8 top-8 h-20 w-3 rotate-12 rounded-full"
                style={{ background: 'rgba(255,255,255,0.55)' }}
              />
              <div className="mx-auto grid h-20 w-20 place-items-center rounded-2xl bg-white/82 backdrop-blur-sm" style={{ color }}>
                <Icon />
              </div>
              <h2 className="mt-5 font-display text-3xl font-bold text-neutral-900">{title}</h2>
              <p className="mt-2 text-sm text-neutral-800">{text}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="wrap py-8 md:py-12">
        <div className="flex items-baseline justify-between gap-3">
          <div>
            <div className="label">The panel</div>
            <h2 className="mt-1 font-display text-3xl md:text-4xl font-extrabold text-strong">Meet your agents</h2>
          </div>
          <Link href="/lab" className="btn btn-ghost">Run a policy →</Link>
        </div>
        <ul className="mt-6 grid gap-4 md:grid-cols-4">
          {AGENTS.map((a) => (
            <li key={a.title} className="card p-5">
              <AgentBadge title={a.title} size="lg" />
              <h3 className="mt-3 font-display text-lg font-bold text-strong">
                {a.title.replace(' Agent', '')}
              </h3>
              <p className="mt-1 text-sm text-muted">{a.blurb}</p>
            </li>
          ))}
        </ul>

        <div className="mt-10">
          <div className="label">The judges</div>
          <h3 className="mt-1 font-display text-3xl md:text-4xl font-extrabold text-strong">Meet your judges</h3>
          <p className="mt-2 text-sm text-muted">
            In battle mode, these judges review Round 1 scores and Round 2 arguments before crowning the final winner.
          </p>
          <div className="mt-5 grid gap-4 md:grid-cols-3">
            <article className="card p-5">
              <span
                className="inline-grid h-10 w-10 place-items-center rounded-2xl border"
                style={{ background: '#fffbeb', color: '#92400e', borderColor: '#fde68a' }}
              >
                ☀️
              </span>
              <h4 className="mt-3 font-display text-lg font-bold text-strong">Optimistic Judge</h4>
              <p className="mt-1 text-sm text-muted">Focuses on upside, long-term gains, and innovation potential.</p>
            </article>

            <article className="card p-5">
              <span
                className="inline-grid h-10 w-10 place-items-center rounded-2xl border"
                style={{ background: '#eef2ff', color: '#4338ca', borderColor: '#c7d2fe' }}
              >
                🧭
              </span>
              <h4 className="mt-3 font-display text-lg font-bold text-strong">Pragmatic Judge</h4>
              <p className="mt-1 text-sm text-muted">Focuses on feasibility, sequencing, and practical implementation.</p>
            </article>

            <article className="card p-5">
              <span
                className="inline-grid h-10 w-10 place-items-center rounded-2xl border"
                style={{ background: '#fef2f2', color: '#b91c1c', borderColor: '#fecaca' }}
              >
                🌧️
              </span>
              <h4 className="mt-3 font-display text-lg font-bold text-strong">Pessimist Judge</h4>
              <p className="mt-1 text-sm text-muted">Focuses on downside risk, fiscal stress, and execution failures.</p>
            </article>
          </div>
        </div>
      </section>

      <section className="wrap py-12 md:py-16">
        <div className="label">Pipeline</div>
        <h2 className="mt-1 font-display text-3xl md:text-4xl font-extrabold text-strong">
          From policy text to verdict in seconds
        </h2>
        <div className="mt-6 grid gap-3 md:grid-cols-5">
          {PIPELINE.map((p) => (
            <div key={p.n} className="card p-5">
              <div className="font-display text-2xl font-extrabold text-primary">{p.n}</div>
              <h3 className="mt-1 font-display text-lg font-bold text-strong">{p.t}</h3>
              <p className="mt-1.5 text-sm leading-snug text-muted">{p.b}</p>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
