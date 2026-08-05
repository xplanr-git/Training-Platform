import { describe, it, expect } from 'vitest';
import { gradeQuiz, parseCorrectIndices, type GradableQuestion } from '@/lib/quiz';

const questions: GradableQuestion[] = [
  { id: 'q1', correct: [1], points: 1 }, // single choice
  { id: 'q2', correct: [0, 2], points: 2 }, // multi select
  { id: 'q3', correct: [0], points: 1 }, // true/false
];

describe('gradeQuiz', () => {
  it('scores a perfect attempt as 100 and passed', () => {
    const r = gradeQuiz(questions, { q1: [1], q2: [0, 2], q3: [0] }, 70);
    expect(r.score).toBe(100);
    expect(r.passed).toBe(true);
    expect(r.earned).toBe(4);
  });

  it('requires exact match for multi-select (partial = 0)', () => {
    const r = gradeQuiz(questions, { q1: [1], q2: [0], q3: [0] }, 70);
    // q2 wrong (partial), earned 2/4 = 50%
    expect(r.score).toBe(50);
    expect(r.passed).toBe(false);
  });

  it('marks wrong single-choice incorrect', () => {
    const r = gradeQuiz(questions, { q1: [0], q2: [0, 2], q3: [1] }, 70);
    // q1 wrong, q3 wrong → earned 2/4 = 50%
    expect(r.perQuestion.find((p) => p.questionId === 'q1')?.isCorrect).toBe(false);
    expect(r.score).toBe(50);
  });

  it('handles unanswered questions and empty quiz', () => {
    expect(gradeQuiz(questions, {}, 70).score).toBe(0);
    expect(gradeQuiz([], {}, 70).score).toBe(0);
  });

  it('respects the pass threshold boundary', () => {
    // 3/4 = 75%
    const r = gradeQuiz(questions, { q1: [1], q2: [0, 2], q3: [1] }, 75);
    expect(r.score).toBe(75);
    expect(r.passed).toBe(true);
  });
});

describe('parseCorrectIndices — the answer key an author types', () => {
  /*
   * The old parser filtered instead of validating, so every typo was silent:
   *
   *   '1,4' with 3 options  -> [0]     one of the two marked answers vanished
   *   '2,2'                 -> [1,1]   ungradeable; gradeQuiz compares sets
   *   mcq '1,3'             -> [0]     truncated by the caller, picking one
   *   '4' / '0'             -> []      then a generic "enter the number" error
   *   '1 3' / '1;3'         -> []      same, for a plausible separator
   *
   * Measured against the real old implementation: it was wrong on 7 of the 12
   * rows below. Only the first three and the two whitespace rows passed — which
   * is why ' 2 ' and '2,' are asserted here too: they work today, and a split
   * without filter(Boolean) would start rejecting them.
   */
  const ok = (raw: string, n: number, type: 'mcq' | 'multi_select', want: number[]) => {
    expect(parseCorrectIndices(raw, n, type)).toEqual(want);
  };

  it('accepts a single answer', () => ok('2', 3, 'multi_select', [1]));
  it('accepts several, comma separated', () => ok('1,3', 3, 'multi_select', [0, 2]));
  it('tolerates spaces after commas', () => ok('1, 3', 3, 'multi_select', [0, 2]));
  it('tolerates a bare space as the separator', () => ok('1 3', 3, 'multi_select', [0, 2]));
  it('tolerates a semicolon', () => ok('1;3', 3, 'multi_select', [0, 2]));
  it('tolerates surrounding whitespace', () => ok(' 2 ', 3, 'multi_select', [1]));
  it('tolerates a trailing comma', () => ok('2,', 3, 'multi_select', [1]));
  it('sorts, so 3,1 and 1,3 store identically', () => ok('3,1', 3, 'multi_select', [0, 2]));

  it('de-duplicates rather than storing an unpassable question', () => {
    // [1,1] can never equal the learner's selected set.
    ok('2,2', 3, 'multi_select', [1]);
  });

  it('rejects a number with no such option, naming the range', () => {
    expect(() => parseCorrectIndices('1,4', 3, 'multi_select')).toThrow(/no option 4/);
    expect(() => parseCorrectIndices('4', 3, 'multi_select')).toThrow(/no option 4/);
  });

  it('rejects zero, since the author counts from one', () => {
    expect(() => parseCorrectIndices('0', 3, 'multi_select')).toThrow(/no option 0/);
  });

  it('rejects a non-integer', () => {
    expect(() => parseCorrectIndices('2.5', 3, 'multi_select')).toThrow(/not an option number/);
    expect(() => parseCorrectIndices('two', 3, 'multi_select')).toThrow(/not an option number/);
  });

  it('rejects an empty key with an instruction, not a NaN message', () => {
    expect(() => parseCorrectIndices('', 3, 'multi_select')).toThrow(/Enter the number/);
    expect(() => parseCorrectIndices('   ', 3, 'multi_select')).toThrow(/Enter the number/);
  });

  it('refuses two answers on a single-answer question instead of dropping one', () => {
    expect(() => parseCorrectIndices('1,3', 3, 'mcq')).toThrow(/single number/);
  });

  it('still allows one answer on a single-answer question', () => ok('3', 3, 'mcq', [2]));

  it('allows a duplicate that collapses to one on mcq', () => {
    // '2,2' is one distinct answer, so it is valid for mcq — the guard is on
    // distinct count, not token count.
    ok('2,2', 3, 'mcq', [1]);
  });

  it('every message fits under the friendly() cap that would replace it', () => {
    const messages: string[] = [];
    for (const [raw, n, type] of [
      ['', 3, 'multi_select'],
      ['9', 3, 'multi_select'],
      ['x', 3, 'multi_select'],
      ['1,2', 3, 'mcq'],
    ] as const) {
      try {
        parseCorrectIndices(raw, n, type);
      } catch (e) {
        messages.push((e as Error).message);
      }
    }
    expect(messages).toHaveLength(4);
    for (const m of messages) {
      // nav-form.tsx friendly() swaps anything >= 120 chars for a generic
      // apology, which would throw away the specific number being named.
      expect(m.length, `too long to survive friendly(): "${m}"`).toBeLessThan(120);
    }
  });
});
