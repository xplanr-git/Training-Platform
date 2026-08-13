'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';
import { Textarea } from '@/components/ui/textarea';

type QuestionType = 'mcq' | 'multi_select' | 'true_false';

/**
 * The coupled half of the add-question form: question type, the options, and the
 * answer key. They live together because the answer key cannot be presented
 * sensibly without knowing the options and the type.
 *
 * What this replaces: a free-text box the author typed 1-based option numbers
 * into ("2", or "1,3"), sitting beside a True/False select, with both rendered
 * whatever the type was. The old comment on that markup admitted the problem —
 * "an author fills in the wrong box and the question silently takes the other
 * one's answer" — and the numbers themselves were the bigger hazard: they were
 * validated by a filter that dropped anything out of range, so "1,4" against
 * three options silently saved one answer instead of erroring.
 *
 * Here the author ticks the answer next to its own text, so there is no number
 * to mistype, no 1-based/0-based translation to get wrong, and only the control
 * that applies to the chosen type is on screen. The submitted shape is
 * unchanged — one `correct` value per ticked option, 1-based, which the action
 * reads with getAll() and parseCorrectIndices still validates, because a
 * hand-posted form is not obliged to use this component.
 */
export function QuizAnswerFields() {
  const [type, setType] = useState<QuestionType>('mcq');
  const [optionsText, setOptionsText] = useState('');

  const options = optionsText
    .split('\n')
    .map((o) => o.trim())
    .filter(Boolean);
  const isChoice = type === 'mcq' || type === 'multi_select';

  return (
    <>
      <div className="flex gap-2">
        <NativeSelect
          name="type"
          aria-label="Question type"
          wrapperClassName="flex-1"
          value={type}
          onChange={(e) => setType(e.target.value as QuestionType)}
        >
          <option value="mcq">Multiple choice (one answer)</option>
          <option value="multi_select">Multiple choice (many answers)</option>
          <option value="true_false">True / False</option>
        </NativeSelect>
        <Input
          name="points"
          type="number"
          min="1"
          aria-label="Points for this question"
          defaultValue={1}
          className="w-20"
        />
      </div>

      {isChoice && (
        <Textarea
          name="options"
          rows={3}
          aria-label="Options, one per line"
          placeholder="Options, one per line"
          value={optionsText}
          onChange={(e) => setOptionsText(e.target.value)}
        />
      )}

      {type === 'true_false' ? (
        <label className="flex items-center gap-2 text-sm">
          <span className="text-muted">Correct answer</span>
          <NativeSelect name="correct_tf" wrapperClassName="w-32">
            <option value="0">True</option>
            <option value="1">False</option>
          </NativeSelect>
        </label>
      ) : options.length === 0 ? (
        // Not an error: it is the ordinary state before any option is typed. The
        // old form showed an answer box here, which invited a number for options
        // that did not exist yet.
        <p className="text-sm text-muted">Type the options above, then tick the correct one.</p>
      ) : (
        <fieldset className="text-sm">
          <legend className="text-muted">
            {type === 'mcq' ? 'Tick the correct answer' : 'Tick every correct answer'}
          </legend>
          <div className="mt-1.5 flex flex-col gap-1.5">
            {options.map((option, i) => (
              <label key={`${i}-${option}`} className="flex items-center gap-2">
                <input
                  // Radio for one answer, checkbox for many: the control itself
                  // tells the author how many they may pick, so a single-answer
                  // question cannot be given two.
                  type={type === 'mcq' ? 'radio' : 'checkbox'}
                  name="correct"
                  // 1-based, matching what the author sees and what the action
                  // parses. parseCorrectIndices converts to the stored 0-based.
                  value={i + 1}
                  required={type === 'mcq'}
                  className="h-4 w-4 accent-primary"
                />
                {/*
                  The label text is the option text alone, so the control
                  announces its answer. Verified in a browser: one <label> each,
                  accessible name "Three"/"Four"/"Five". An earlier version
                  prefixed a muted "1." — dropped as redundant, since the whole
                  point is that the author ticks text rather than counting.
                */}
                <span>{option}</span>
              </label>
            ))}
          </div>
        </fieldset>
      )}
    </>
  );
}
