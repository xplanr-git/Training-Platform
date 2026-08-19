'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/components/ui/utils';
import { VoiceTextarea } from '@/components/voice-textarea';

/**
 * Post-completion confidence — the one outcome question worth asking once the
 * training is done: does the learner feel ready to do the work? It measures the
 * training's real job (readiness), not satisfaction.
 *
 * Hard rule: this NEVER gates completion, the certificate, status, or
 * navigation. The course is already complete when this renders; answering is
 * entirely voluntary, and "I need more guidance" is a routing signal to Outdure,
 * never a demotion of the learner's standing. Only that answer earns a follow-up
 * (what would help), because that is the actionable one.
 */

const LEVELS = [
  { key: 'very', label: 'Very confident' },
  { key: 'fairly', label: 'Fairly confident' },
  { key: 'more_guidance', label: 'I need more guidance' },
] as const;

type Level = (typeof LEVELS)[number]['key'];

export function CourseConfidence({
  action,
  subject = 'installing on site',
}: {
  action: (input: { level: Level; comment: string }) => Promise<{ ok: true } | { error: string }>;
  subject?: string;
}) {
  const [level, setLevel] = useState<Level | null>(null);
  const [comment, setComment] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (done) {
    return (
      <p className="text-foreground-2 text-sm">
        Thanks — that helps us support you and improve the training.
      </p>
    );
  }

  const needsGuidance = level === 'more_guidance';
  async function send() {
    if (busy || !level) return;
    setBusy(true);
    setError(null);
    try {
      const res = await action({ level, comment });
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
      <p className="text-sm font-semibold">
        After this training, how confident do you feel {subject}?
      </p>
      <p className="text-muted mt-0.5 text-xs">Optional — this won’t change your result.</p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
        {LEVELS.map((l) => (
          <button
            key={l.key}
            type="button"
            aria-pressed={level === l.key}
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

      {needsGuidance && (
        <label className="mt-4 block">
          <span className="text-foreground-2 text-sm">
            What would help you feel ready? <span className="text-muted">(optional)</span>
          </span>
          <div className="mt-1.5">
            <VoiceTextarea
              value={comment}
              onChange={setComment}
              label="What would help you feel ready?"
              placeholder="A refresher on a step, a call with support, more practice…"
            />
          </div>
        </label>
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
