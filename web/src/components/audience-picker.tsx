'use client';

import { useState } from 'react';
import { AUDIENCE_OPTIONS } from '@/lib/audience';
import { cn } from '@/components/ui/utils';

/**
 * First-use audience question — the smallest thing that makes the experience
 * relevant, shown only when neither admin nor Connect has set an audience. One
 * tap sets it and the Home re-renders relevant. Not a wizard; not status.
 */
export function AudiencePicker({
  action,
}: {
  action: (value: string) => Promise<{ ok: true } | { error: string }>;
}) {
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function pick(value: string) {
    if (busy) return;
    setBusy(value);
    setError(null);
    try {
      const res = await action(value);
      if (!(res && 'ok' in res)) setError((res && 'error' in res && res.error) || 'Try again.');
      // On success the server revalidates the Home; the picker disappears.
    } catch {
      setError('Try again.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="border-border rounded-(--radius-card) border px-5 py-4">
      <p className="text-sm font-semibold">Which best describes you?</p>
      <p className="text-muted mt-0.5 text-meta">
        So we show you the training that’s relevant. You can change this later.
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {AUDIENCE_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            disabled={!!busy}
            onClick={() => pick(o.value)}
            className={cn(
              'border-input text-foreground-2 hover:bg-surface-muted inline-flex min-h-11 items-center rounded-sm border px-4 text-sm font-semibold transition-colors',
              busy === o.value && 'bg-sunken',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>
      {error && <p className="text-status-red mt-2 text-sm">{error}</p>}
    </div>
  );
}
