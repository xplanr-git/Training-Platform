'use client';

import { useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/components/ui/utils';
import { VoiceTextarea } from '@/components/voice-textarea';

/**
 * Private, diagnostic lesson feedback — NOT a like/dislike sentiment score.
 *
 * "How was this lesson?" is multi-select because the truthful answer often is:
 * an experienced installer can already know most of a required lesson AND still
 * hit something unclear. Each response maps to a real Outdure decision (see the
 * slice notes). Only "Something wasn't clear" earns a follow-up — the comment
 * that names WHAT to explain better (the actionable part). Everything else is
 * one deliberate action. No thumbs, no red/green: a selection reads through the
 * control's own ink/sunken state.
 */

const OPTIONS = [
  { key: 'clear', label: 'Clear — I understood it' },
  { key: 'learnt', label: 'I learnt something new' },
  { key: 'knew', label: 'I already knew this' },
  { key: 'unclear', label: 'Something wasn’t clear' },
] as const;

export function LessonFeedback({
  action,
  prompt = false,
}: {
  action: (input: {
    responses: string[];
    comment: string;
  }) => Promise<{ ok: true } | { error: string }>;
  prompt?: boolean;
}) {
  const [open, setOpen] = useState(prompt);
  const [responses, setResponses] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (done) {
    return (
      <p className="text-foreground-2 text-sm">
        Thanks — your feedback helps us improve the training.
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
        <MessageSquarePlus aria-hidden="true" className="h-4 w-4" /> Give feedback
      </button>
    );
  }

  const unclear = responses.includes('unclear');
  function toggle(k: string) {
    setResponses((rs) => (rs.includes(k) ? rs.filter((x) => x !== k) : [...rs, k]));
  }
  async function send() {
    if (busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await action({ responses, comment });
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
      <p className="text-sm font-semibold">How was this lesson?</p>
      <p className="text-muted mt-0.5 text-xs">Pick any that apply.</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {OPTIONS.map((o) => (
          <button
            key={o.key}
            type="button"
            aria-pressed={responses.includes(o.key)}
            onClick={() => toggle(o.key)}
            className={cn(
              'inline-flex min-h-11 items-center rounded-sm border px-4 text-sm font-semibold transition-colors',
              responses.includes(o.key)
                ? 'border-foreground bg-sunken'
                : 'border-input text-foreground-2 hover:bg-surface-muted',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>

      {/* Follow-up only where it is actionable: what to explain better. */}
      {unclear && (
        <label className="mt-4 block">
          <span className="text-foreground-2 text-sm">
            What could we explain better? <span className="text-muted">(optional)</span>
          </span>
          <div className="mt-1.5">
            <VoiceTextarea
              value={comment}
              onChange={setComment}
              label="What could we explain better?"
              placeholder="Which part, and what would make it clearer"
            />
          </div>
        </label>
      )}

      <p className="text-muted mt-3 text-xs">
        Private feedback to Outdure — other learners don’t see this.
      </p>
      {error && <p className="text-status-red mt-2 text-sm">{error}</p>}

      <div className="mt-4 flex items-center gap-4">
        <Button type="button" onClick={send} disabled={busy || (!responses.length && !comment)}>
          {busy ? 'Sending…' : 'Send feedback'}
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
