const KEY = 'govsim.session_id';

export function getSessionId(): string {
  if (typeof window === 'undefined') return 'server';
  const existing = window.localStorage.getItem(KEY);
  if (existing) return existing;
  const next = 'sess_' + Math.random().toString(36).slice(2, 12);
  window.localStorage.setItem(KEY, next);
  return next;
}
