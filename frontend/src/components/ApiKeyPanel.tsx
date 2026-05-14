'use client';

import { useEffect, useState } from 'react';
import {
  clearOpenAIKey,
  getOpenAIKey,
  isValidOpenAIKeyShape,
  maskKey,
  setOpenAIKey,
} from '@/lib/apiKey';

type Props = {
  onChange?: (hasKey: boolean) => void;
};

export function ApiKeyPanel({ onChange }: Props) {
  const [key, setKey] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [show, setShow] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const sync = () => {
      const k = getOpenAIKey();
      setKey(k);
      onChange?.(!!k);
    };
    sync();
    window.addEventListener('govsim-key-changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('govsim-key-changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, [onChange]);

  const save = () => {
    const v = draft.trim();
    if (!isValidOpenAIKeyShape(v)) {
      setError('That does not look like a valid OpenAI key.');
      return;
    }
    setOpenAIKey(v);
    setDraft('');
    setEditing(false);
    setError(null);
  };

  const remove = () => {
    clearOpenAIKey();
    setDraft('');
    setEditing(false);
    setError(null);
  };

  const hasKey = !!key;

  return (
    <div className="card p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="label">OpenAI API key · BYOK</div>
          <div className="mt-1 font-display text-lg font-semibold text-strong">
            {hasKey ? 'Connected' : 'Add your key'}
          </div>
          <p className="mt-1 max-w-md text-sm leading-relaxed text-muted">
            Stored only in this browser. Sent per request to the backend and forwarded
            to OpenAI. We never log it.
          </p>
        </div>
        <span className={hasKey ? 'chip chip-tertiary' : 'chip chip-coral'}>
          <span
            className={`h-1.5 w-1.5 rounded-full ${hasKey ? 'bg-tertiary-600' : 'bg-coral'}`}
            style={{ background: hasKey ? '#059669' : '#ef4444' }}
          />
          {hasKey ? 'active' : 'missing'}
        </span>
      </div>

      {hasKey && !editing && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <code className="rounded-lg border border-neutral-200 bg-neutral-50 px-2.5 py-1 font-mono text-xs text-neutral-700">
            {maskKey(key!)}
          </code>
          <button type="button" onClick={() => setEditing(true)} className="btn btn-outline btn-sm">
            Replace
          </button>
          <button type="button" onClick={remove} className="btn btn-ghost btn-sm text-coral-500" style={{ color: '#b91c1c' }}>
            Remove
          </button>
        </div>
      )}

      {(editing || !hasKey) && (
        <div className="mt-4 space-y-2">
          <div className="flex items-stretch gap-2">
            <input
              type={show ? 'text' : 'password'}
              autoComplete="off"
              spellCheck={false}
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                if (error) setError(null);
              }}
              placeholder="sk-..."
              className="field flex-1 font-mono text-sm"
            />
            <button type="button" onClick={() => setShow((s) => !s)} className="btn btn-outline btn-sm">
              {show ? 'Hide' : 'Show'}
            </button>
            <button type="button" onClick={save} className="btn btn-primary btn-sm">
              Save
            </button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <p className="label">
            Get a key at{' '}
            <a
              href="https://platform.openai.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="underline text-primary-700"
            >
              platform.openai.com/api-keys
            </a>
          </p>
        </div>
      )}
    </div>
  );
}
