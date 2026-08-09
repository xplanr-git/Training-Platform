'use client';

import { useRef, useState } from 'react';
import { NavForm } from '@/components/nav-form';
import { Button } from '@/components/ui/button';

export interface QuizFormQuestion {
  id: string;
  prompt: string;
  type: string;
  options: string[];
}

/**
 * Client quiz form. Renders questions (native radio/checkbox inputs so grading
 * + live E2E are unaffected) inside a NavForm, and captures a per-question time
 * proxy: ms elapsed since the previous interaction, accumulated per question.
 * Emitted as hidden `t_<questionId>` fields, stored as quiz_answers.duration_ms
 * for friction insights. Low-friction: nothing forces answering every question.
 */
export function QuizForm({
  action,
  questions,
}: {
  action: (formData: FormData) => Promise<{ redirectTo?: string; error?: string } | void>;
  questions: QuizFormQuestion[];
}) {
  const lastRef = useRef<number>(Date.now());
  const [durations, setDurations] = useState<Record<string, number>>({});

  function recordAnswer(qid: string) {
    const now = Date.now();
    setDurations((d) => ({ ...d, [qid]: (d[qid] ?? 0) + (now - lastRef.current) }));
    lastRef.current = now;
  }

  return (
    <NavForm action={action} className="space-y-5">
      {questions.map((q, qi) => {
        const multi = q.type === 'multi_select';
        return (
          <fieldset
            key={q.id}
            className="rounded-(--radius-card) border border-border bg-surface p-4"
          >
            <legend className="px-1 text-sm font-medium">
              {qi + 1}. {q.prompt}
            </legend>
            <div className="mt-3 space-y-2">
              {q.options.map((o, oi) => (
                <label
                  key={oi}
                  className="flex cursor-pointer items-center gap-2.5 rounded-md border border-border px-3 py-3 text-sm transition-colors hover:bg-surface-muted has-[:checked]:border-primary has-[:checked]:bg-sunken"
                >
                  <input
                    type={multi ? 'checkbox' : 'radio'}
                    name={`q_${q.id}`}
                    value={oi}
                    onChange={() => recordAnswer(q.id)}
                    className="accent-primary"
                  />
                  {o}
                </label>
              ))}
            </div>
          </fieldset>
        );
      })}
      {Object.entries(durations).map(([qid, ms]) => (
        <input key={qid} type="hidden" name={`t_${qid}`} value={ms} readOnly />
      ))}
      <Button type="submit">Submit quiz</Button>
    </NavForm>
  );
}
