'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { listReports } from '@/lib/store';
import type { PolicyReport } from '@/lib/types';

const RISK_CHIP: Record<string, string> = {
  Low: 'chip chip-tertiary',
  Medium: 'chip chip-primary',
  High: 'chip chip-coral',
};

export function HistoryList() {
  const [items, setItems] = useState<PolicyReport[] | null>(null);

  useEffect(() => {
    setItems(listReports());
  }, []);

  if (items === null) {
    return <p className="mt-10 label">loading…</p>;
  }

  if (items.length === 0) {
    return (
      <div className="card-lifted mt-10 p-10 text-center">
        <h2 className="font-display text-3xl md:text-4xl font-extrabold text-strong">No simulations yet</h2>
        <p className="mt-3 label">Reports are stored locally in this browser.</p>
        <div className="mt-6">
          <Link href="/lab" className="btn btn-primary">Run your first simulation</Link>
        </div>
      </div>
    );
  }

  return (
    <ul className="mt-10 grid gap-4 md:grid-cols-2">
      {items.map((r) => (
        <li key={r.id}>
          <Link
            href={`/report/${r.id}`}
            className="card block p-5 transition hover:-translate-y-0.5 hover:shadow-[0_24px_50px_rgba(15,23,42,0.10)]"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="font-display text-lg md:text-xl font-bold text-strong line-clamp-2">{r.title}</div>
              <span className={RISK_CHIP[r.scorecard.risk_score] ?? RISK_CHIP.Medium}>
                {r.scorecard.risk_score}
              </span>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              <span className="chip chip-primary">{r.mode === 'battle' ? 'Battle' : 'Single'}</span>
              <span className="chip">{new Date(r.createdAt).toLocaleDateString()}</span>
              <span className="chip">{r.agents.length} agents</span>
              {r.battle_verdict && (
                <span className={r.battle_verdict.winner === 'tie' ? 'chip chip-secondary' : r.battle_verdict.winner === 'A' ? 'chip chip-primary' : 'chip chip-tertiary'}>
                  Winner: {r.battle_verdict.winner === 'tie' ? 'Tie' : `Policy ${r.battle_verdict.winner}`}
                </span>
              )}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
