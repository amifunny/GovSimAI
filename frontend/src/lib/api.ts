import { getOpenAIKey } from './apiKey';

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL?.replace(/\/$/, '') ?? 'http://127.0.0.1:8000';

export function apiUrl(path: string) {
  const clean = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${clean}`;
}

export async function apiFetchJson(path: string, init?: RequestInit) {
  const key = getOpenAIKey();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((init?.headers as Record<string, string>) ?? {}),
  };
  if (key) headers['x-openai-api-key'] = key;
  return fetch(apiUrl(path), { ...init, headers });
}

export async function apiFetchForm(path: string, form: FormData) {
  const key = getOpenAIKey();
  const headers: Record<string, string> = {};
  if (key) headers['x-openai-api-key'] = key;
  return fetch(apiUrl(path), { method: 'POST', body: form, headers });
}

export async function readApiError(resp: Response, fallback: string): Promise<string> {
  try {
    const j = await resp.json();
    return j.detail || j.error || j.message || fallback;
  } catch {
    return fallback;
  }
}
