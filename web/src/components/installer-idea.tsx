'use client';

import { useState } from 'react';
import { Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VoiceTextarea } from '@/components/voice-textarea';

/**
 * Innovation capture — DELIBERATELY separate from lesson feedback.
 *
 * An installer on site is the person most likely to see a better product,
 * detail, method, or a gap in the docs. That signal has nothing to do with
 * whether a lesson was clear, so it gets its own quiet affordance rather than
 * being flattened into a rating. Smallest possible structured capture: one open
 * field routed to Outdure. Not a forum, not a voting board.
 */

export function InstallerIdea({
  action,
}: {
  action: (input: { idea: string }) => Promise<{ ok: true } | { error: string }>;
}) {
  const [open, setOpen] = useState(false);
  const [idea, setIdea] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (done) {
    return (
      <p className="text-foreground-2 text-sm">
        Thanks — we’ve passed your idea to the Outdure team.
      </p>
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="text-foreground-2 hover:text-foreground inline-flex min-h-11 items-center gap-2 text-sm font-semibold transition-colors"
      >
        <Lightbulb aria-hidden="true" className="h-4 w-4" /> Share an idea
      </button>
    );
  }

  async function send() {
    if (busy || !idea.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const res = await action({ idea });
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
      <p className="text-sm font-semibold">Think this could be better?</p>
      <p className="text-muted mt-0.5 text-meta">
        A better product, detail, install method, or something missing from the docs — tell us what
        you’d change.
      </p>
      <div className="mt-3">
        <VoiceTextarea
          value={idea}
          onChange={setIdea}
          label="Your idea"
          placeholder="What you’d change, and why it would help on site"
          rows={4}
        />
      </div>
      {error && <p className="text-status-red mt-2 text-sm">{error}</p>}
      <div className="mt-4 flex items-center gap-4">
        <Button type="button" onClick={send} disabled={busy || !idea.trim()}>
          {busy ? 'Sending…' : 'Send idea'}
        </Button>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-foreground-2 hover:text-foreground text-sm font-semibold"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
