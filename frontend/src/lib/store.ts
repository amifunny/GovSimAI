'use client';

import type { PolicyReport } from './types';

const KEY = 'govsim.reports.v1';

function read(): PolicyReport[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as PolicyReport[]) : [];
  } catch {
    return [];
  }
}

function write(list: PolicyReport[]) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {}
}

export function listReports(): PolicyReport[] {
  return read().sort((a, b) => b.createdAt - a.createdAt);
}

export function getReport(id: string): PolicyReport | undefined {
  return read().find((r) => r.id === id);
}

export function saveReport(r: PolicyReport) {
  const list = read().filter((x) => x.id !== r.id);
  list.unshift(r);
  write(list.slice(0, 80));
}

export function deleteReport(id: string) {
  write(read().filter((r) => r.id !== id));
}

export function newReportId() {
  return 'rep_' + Math.random().toString(36).slice(2, 10);
}
