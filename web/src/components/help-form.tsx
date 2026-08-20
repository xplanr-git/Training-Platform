'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

/**
 * Help v1 — a short message. Context (page, course, topic, item) is carried
 * server-side via the bound action, so the learner only writes the problem.
 */
export function HelpForm({
  action,
  contextLine,
}: {
  action: (message: string) => Promise<{ ok: true } | { error: string }>;
  contextLine?: string | null;
}) {
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (done) {
    return (
      <p className="text-foreground-2 text-sm">
        Thanks — we’ve got your message and the Outdure team will follow up.
      </p>
    );
  }

  async function send() {
    if (busy || !message.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await action(message);
      if (res && 'ok' in res) setDone(true);
      else setError((res && 'error' in res && res.error) || 'Could not send that. Try again.');
    } catch {
      setError('Could not send that. Try again.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-prose">
      <label className="block">
        <span className="text-sm font-semibold">What do you need help with?</span>
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={5}
          maxLength={4000}
          placeholder="Describe the problem or question — where you were and what happened."
          className="border-input bg-surface mt-1.5 w-full rounded-sm border px-3 py-2 text-sm"
        />
      </label>
      {contextLine && (
        <p className="text-muted mt-1 text-meta">We’ll include where you were: {contextLine}</p>
      )}
      {error && <p className="text-status-red mt-2 text-sm">{error}</p>}
      <div className="mt-4">
        <Button type="button" onClick={send} disabled={busy || !message.trim()}>
          {busy ? 'Sending…' : 'Send to Outdure'}
        </Button>
      </div>
    </div>
  );
}
