'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/components/ui/utils';

export interface QuizFormQuestion {
  id: string;
  prompt: string;
  type: string;
  options: string[];
}

type Result = { isCorrect: boolean; correct: number[] };

/**
 * The knowledge check — ONE question at a time.
 *
 * Flow per question: pick an answer → Check answer → a formative result (right /
 * not quite, with the correct option shown) → Next question. On the last
 * question, Finish submits the whole attempt for the AUTHORITATIVE grade
 * (submitQuizAttempt), which records it and decides pass / needs-review.
 *
 * Integrity, not ceremony: `checkAction` grades one question on the SERVER and
 * never returns the key up front, so a warranty-critical check can't be read out
 * of the page source; and once a question is checked its inputs lock, so a wrong
 * critical answer can't be quietly changed before finishing — it flows into the
 * review-then-retry rule. Native radio/checkbox inputs keep grading + E2E intact.
 */
export function QuizForm({
  questions,
  checkAction,
  submitAction,
}: {
  questions: QuizFormQuestion[];
  checkAction: (questionId: string, selected: number[]) => Promise<Result>;
  submitAction: (formData: FormData) => Promise<{ redirectTo?: string; error?: string } | void>;
}) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [selections, setSelections] = useState<Record<string, number[]>>({});
  const [results, setResults] = useState<Record<string, Result>>({});
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const q = questions[step];
  const multi = q.type === 'multi_select';
  const selected = selections[q.id] ?? [];
  const result = results[q.id];
  const checked = !!result;
  const isLast = step === questions.length - 1;

  function toggle(oi: number) {
    if (checked) return;
    setSelections((s) => {
      const cur = s[q.id] ?? [];
      if (multi) {
        return { ...s, [q.id]: cur.includes(oi) ? cur.filter((x) => x !== oi) : [...cur, oi] };
      }
      return { ...s, [q.id]: [oi] };
    });
  }

  async function check() {
    if (!selected.length || busy) return;
    setBusy(true);
    setError(null);
    try {
      const r = await checkAction(q.id, selected);
      setResults((m) => ({ ...m, [q.id]: r }));
    } catch {
      setError('Something went wrong checking that answer. Try again.');
    } finally {
      setBusy(false);
    }
  }

  async function finish() {
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
    } catch {
      setError('Something went wrong finishing the check. Try again.');
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

      <div className="mt-5 flex flex-col gap-2.5">
        {q.options.map((o, oi) => {
          const isSel = selected.includes(oi);
          const isCorrectOpt = checked && result.correct.includes(oi);
          const isWrongSel = checked && isSel && !result.correct.includes(oi);
          return (
            <label
              key={oi}
              className={cn(
                'flex min-h-11 items-center gap-3 rounded-sm border px-4 py-3 text-sm transition-colors',
                checked ? 'cursor-default' : 'cursor-pointer hover:bg-surface-muted',
                isCorrectOpt
                  ? 'border-status-green bg-status-green-bg'
                  : isWrongSel
                    ? 'border-foreground'
                    : isSel
                      ? 'border-foreground bg-sunken shadow-[inset_0_0_0_1px_var(--color-foreground)]'
                      : 'border-input',
              )}
            >
              <input
                type={multi ? 'checkbox' : 'radio'}
                name={`q_${q.id}`}
                value={oi}
                checked={isSel}
                disabled={checked}
                onChange={() => toggle(oi)}
                className="accent-primary"
              />
              <span className="flex-1">{o}</span>
              {isCorrectOpt && (
                <Check aria-hidden="true" className="text-status-green h-4 w-4 shrink-0" />
              )}
            </label>
          );
        })}
      </div>

      {error && <p className="text-status-red mt-3 text-sm">{error}</p>}

      {!checked ? (
        <div className="mt-6">
          <Button type="button" onClick={check} disabled={!selected.length || busy}>
            {busy ? 'Checking…' : 'Check answer'}
          </Button>
        </div>
      ) : (
        <div className="mt-5">
          {result.isCorrect ? (
            <p className="text-foreground-2 flex items-start gap-2 text-sm">
              <Check aria-hidden="true" className="text-status-green mt-0.5 h-4 w-4 shrink-0" />
              <span>
                <b className="text-foreground">Correct.</b>
              </span>
            </p>
          ) : (
            <p className="text-foreground-2 text-sm">
              <b className="text-foreground">Not quite.</b> The correct answer is highlighted above.
            </p>
          )}
          <div className="mt-5">
            {isLast ? (
              <Button type="button" onClick={finish} disabled={busy}>
                {busy ? 'Finishing…' : 'Finish check'}
              </Button>
            ) : (
              <Button type="button" onClick={() => setStep((s) => s + 1)}>
                Next question
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
