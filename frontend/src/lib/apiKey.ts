// User-provided OpenAI API key, kept only in browser localStorage and sent as
// a per-request header. Never persisted on the server.

const STORAGE_KEY = 'govsim.openai_api_key';

export function getOpenAIKey(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const v = window.localStorage.getItem(STORAGE_KEY);
    return v && v.trim() ? v.trim() : null;
  } catch {
    return null;
  }
}

export function setOpenAIKey(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    const trimmed = key.trim();
    if (trimmed) {
      window.localStorage.setItem(STORAGE_KEY, trimmed);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    window.dispatchEvent(new Event('govsim-key-changed'));
  } catch {}
}

export function clearOpenAIKey(): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new Event('govsim-key-changed'));
  } catch {}
}

export function isValidOpenAIKeyShape(key: string): boolean {
  const k = key.trim();
  return k.length >= 20 && !k.includes(' ');
}

export function maskKey(key: string): string {
  const k = key.trim();
  if (k.length <= 8) return '••••';
  return `${k.slice(0, 4)}••••${k.slice(-4)}`;
}
