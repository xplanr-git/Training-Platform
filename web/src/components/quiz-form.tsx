'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { friendly, isFrameworkNavigation } from '@/lib/action-errors';
import { cn } from '@/components/ui/utils';

export interface QuizFormQuestion {
  id: string;
  prompt: string;
  type: string;
  options: string[];
}

/**
 * The knowledge check — ONE question at a time, minimum clicks.
 *
 * Flow: pick an answer → Next. Advancing just records the selection in local
 * state; nothing is graded mid-check, so there is no per-question "Check answer"
 * step and no answer is ever revealed early (the key never reaches the page).
 * On the last question, Finish submits the whole attempt for the AUTHORITATIVE
 * server grade (submitQuizAttempt), which records it and decides pass /
 * needs-review — exactly as before. A quiet Back lets the learner revise an
 * earlier answer before finishing (safe, since nothing is locked or graded until
 * Finish).
 *
 * Integrity is unchanged: grading, the critical-question rule, Required Review
 * and one-review-unlocks-one-retry all live in submitQuizAttempt on the server.
 * Removing the mandatory mid-check step lowers interaction cost, not the bar.
 * Immediate correct/incorrect feedback is deliberately OFF here (formative
 * reveal added back only for specific questions if that ever earns its place).
 * A selection is required before advancing, so no question is answered blank.
 */
export function QuizForm({
  questions,
  submitAction,
}: {
  questions: QuizFormQuestion[];
  submitAction: (formData: FormData) => Promise<{ redirectTo?: string; error?: string } | void>;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState<Record<string, number[]>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const q = questions[step];
  const multi = q.type === 'multi_select';
  const selected = selections[q.id] ?? [];
  const isLast = step === questions.length - 1;
  const canAdvance = selected.length > 0;

  function toggle(oi: number) {
    setSelections((s) => {
      const cur = s[q.id] ?? [];
      if (multi) {
        return { ...s, [q.id]: cur.includes(oi) ? cur.filter((x) => x !== oi) : [...cur, oi] };
      }
      return { ...s, [q.id]: [oi] };
    });
  }

  async function finish() {
    if (!canAdvance || busy) return;
    setBusy(true);
    setError(null);
    const fd = new FormData();
    for (const [qid, sel] of Object.entries(selections)) {
      for (const oi of sel) fd.append(`q_${qid}`, String(oi));
    }
    try {
      const res = await submitAction(fd);
      if (res && 'redirectTo' in res && res.redirectTo) {
        router.push(res.redirectTo);
      } else if (res && 'error' in res && res.error) {
        setError(res.error);
        setBusy(false);
      }
    } catch (err) {
      // redirect()/notFound() from the action throw a NEXT_* digest — it MUST
      // propagate, or a session that expired mid-check is swallowed into a
      // generic error instead of sending the learner to sign in.
      if (isFrameworkNavigation(err)) throw err;
      console.error('[quiz submit failed]', err);
      setError(
        err instanceof Error && err.message
          ? friendly(err.message)
          : 'Something went wrong finishing the check. Try again.',
      );
      setBusy(false);
    }
  }

  return (
    <div>
      {/* Position — useful but quiet; not a score dashboard. */}
      <p className="text-foreground-2 text-sm font-semibold tabular-nums">
        Question {step + 1} of {questions.length}
      </p>
      <h2 className="text-h2 mt-2">{q.prompt}</h2>
      {multi && <p className="text-muted mt-1 text-meta">Choose all that apply.</p>}

      <div className="mt-5 flex flex-col gap-2.5">
        {q.options.map((o, oi) => {
          const isSel = selected.includes(oi);
          return (
            <label
              key={oi}
              className={cn(
                'flex min-h-11 cursor-pointer items-center gap-3 rounded-sm border px-4 py-3 text-sm transition-colors',
                isSel
                  ? 'border-foreground bg-sunken shadow-[inset_0_0_0_1px_var(--color-foreground)]'
                  : 'border-input hover:bg-surface-muted',
              )}
            >
              <input
                type={multi ? 'checkbox' : 'radio'}
                name={`q_${q.id}`}
                value={oi}
                checked={isSel}
                onChange={() => toggle(oi)}
                className="accent-primary"
              />
              <span className="flex-1">{o}</span>
            </label>
          );
        })}
      </div>

      {error && <p className="text-status-red mt-3 text-sm">{error}</p>}

      {/* Question navigation only. Back is a quiet secondary on the LEFT; the ONE
          primary action per state (Next, or Finish on the last question) sits on
          the RIGHT, so the dominant action is always where the eye ends. */}
      <div className="mt-6 flex items-center justify-end gap-4">
        {step > 0 && (
          <button
            type="button"
            onClick={() => setStep((s) => s - 1)}
            disabled={busy}
            className="text-foreground-2 hover:text-foreground mr-auto inline-flex min-h-11 items-center gap-1 text-sm font-semibold transition-colors"
          >
            <ArrowLeft aria-hidden="true" className="h-4 w-4" /> Back
          </button>
        )}
        {isLast ? (
          <Button type="button" onClick={finish} disabled={!canAdvance || busy}>
            {busy ? 'Finishing…' : 'Finish check'}
          </Button>
        ) : (
          <Button type="button" onClick={() => setStep((s) => s + 1)} disabled={!canAdvance}>
            Next <ArrowRight aria-hidden="true" className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
