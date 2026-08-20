'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/components/ui/utils';
import { VoiceTextarea } from '@/components/voice-textarea';
import { CONFIDENCE_LEVELS, LOW_LEVELS, type ConfidenceLevel } from '@/lib/confidence';

/**
 * One reusable confidence control for the course baseline, the practical
 * topic checkpoints, and the completion outcome — always the same ordinal
 * 4-point scale so answers are comparable and the learner learns one control.
 *
 * A low answer (not-yet / somewhat) optionally reveals "what would help?" —
 * structured reasons + an optional note (typed or spoken). It is never required
 * and never blocks. No numbers, stars, emoji, or red/amber/green: the chosen
 * level reads through the control's own state.
 */

export type ConfidenceInput = { level: string; reasons: string[]; comment: string };

export function ConfidenceCheck({
  prompt,
  helpText,
  action,
  followup,
  ackText,
}: {
  prompt: string;
  helpText?: string;
  action: (input: ConfidenceInput) => Promise<{ ok: true } | { error: string }>;
  /** When set, a low answer reveals this optional follow-up. */
  followup?: { prompt: string; reasons: { key: string; label: string }[] };
  ackText: string;
}) {
  const [level, setLevel] = useState<ConfidenceLevel | null>(null);
  const [reasons, setReasons] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (done) {
    return <p className="text-foreground-2 text-sm">{ackText}</p>;
  }

  const isLow = !!level && LOW_LEVELS.includes(level);
  const showFollowup = !!followup && isLow;

  function toggleReason(k: string) {
    setReasons((rs) => (rs.includes(k) ? rs.filter((x) => x !== k) : [...rs, k]));
  }

  async function send() {
    if (busy || !level) return;
    setBusy(true);
    setError(null);
    try {
      const res = await action({
        level,
        reasons: showFollowup ? reasons : [],
        comment: showFollowup ? comment : '',
      });
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
      <p className="text-sm font-semibold">{prompt}</p>
      {helpText && <p className="text-muted mt-0.5 text-xs">{helpText}</p>}
      <div
        role="radiogroup"
        aria-label={prompt}
        className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap"
      >
        {CONFIDENCE_LEVELS.map((l) => (
          <button
            key={l.key}
            type="button"
            role="radio"
            aria-checked={level === l.key}
            onClick={() => setLevel(l.key)}
            className={cn(
              'inline-flex min-h-11 items-center rounded-sm border px-4 text-sm font-semibold transition-colors',
              level === l.key
                ? 'border-foreground bg-sunken'
                : 'border-input text-foreground-2 hover:bg-surface-muted',
            )}
          >
            {l.label}
          </button>
        ))}
      </div>

      {showFollowup && (
        <div className="mt-4">
          <p className="text-foreground-2 text-sm">
            {followup.prompt} <span className="text-muted">(optional)</span>
          </p>
          <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            {followup.reasons.map((r) => (
              <button
                key={r.key}
                type="button"
                aria-pressed={reasons.includes(r.key)}
                onClick={() => toggleReason(r.key)}
                className={cn(
                  'inline-flex min-h-11 items-center rounded-sm border px-4 text-sm font-semibold transition-colors',
                  reasons.includes(r.key)
                    ? 'border-foreground bg-sunken'
                    : 'border-input text-foreground-2 hover:bg-surface-muted',
                )}
              >
                {r.label}
              </button>
            ))}
          </div>
          <div className="mt-2.5">
            <VoiceTextarea
              value={comment}
              onChange={setComment}
              label={followup.prompt}
              placeholder="Anything else that would help (optional)"
            />
          </div>
        </div>
      )}

      {error && <p className="text-status-red mt-2 text-sm">{error}</p>}
      <div className="mt-4">
        <Button type="button" onClick={send} disabled={busy || !level}>
          {busy ? 'Sending…' : 'Send'}
        </Button>
      </div>
    </div>
  );
}
