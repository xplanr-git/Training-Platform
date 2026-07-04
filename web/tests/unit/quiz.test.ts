import { describe, it, expect } from 'vitest';
import { gradeQuiz, type GradableQuestion } from '@/lib/quiz';

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
