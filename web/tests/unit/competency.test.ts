import { describe, it, expect } from 'vitest';
import {
  criticalQuestionIds,
  isCriticalCheck,
  allCriticalCorrect,
  reviewRequired,
} from '@/lib/competency';

const q = (id: string, critical: boolean) => ({ id, critical });

describe('critical questions', () => {
  it('identifies the critical question ids', () => {
    expect(criticalQuestionIds([q('a', true), q('b', false), q('c', true)])).toEqual(['a', 'c']);
  });

  it('a check is critical iff it has any critical question', () => {
    expect(isCriticalCheck([q('a', false), q('b', false)])).toBe(false);
    expect(isCriticalCheck([q('a', false), q('b', true)])).toBe(true);
  });
});

describe('allCriticalCorrect — critical knowledge must actually be passed', () => {
  it('passes only when EVERY critical question is correct', () => {
    const critical = ['bracing', 'beam'];
    expect(allCriticalCorrect(critical, new Set(['bracing', 'beam', 'easy']))).toBe(true);
  });

  it('a wrong critical answer cannot be offset by easy correct answers', () => {
    const critical = ['bracing', 'beam'];
    // Got the easy ones and one critical, but missed bracing → not passed.
    expect(allCriticalCorrect(critical, new Set(['beam', 'easy1', 'easy2']))).toBe(false);
  });
});

describe('reviewRequired — fail must trigger review before another attempt', () => {
  const base = {
    isCritical: true,
    lessonCompleted: false,
    priorAttemptCount: 1,
    reviewedSinceLastAttempt: false,
  };

  it('never blocks a non-critical quiz', () => {
    expect(reviewRequired({ ...base, isCritical: false })).toBe(false);
  });

  it('never blocks once the check is passed (lesson completed)', () => {
    expect(reviewRequired({ ...base, lessonCompleted: true })).toBe(false);
  });

  it('allows the first attempt (no prior attempt)', () => {
    expect(reviewRequired({ ...base, priorAttemptCount: 0 })).toBe(false);
  });

  it('blocks a retry after a fail until the section is reviewed', () => {
    expect(reviewRequired(base)).toBe(true);
  });

  it('unlocks one retry once the section has been reviewed since the last attempt', () => {
    expect(reviewRequired({ ...base, reviewedSinceLastAttempt: true })).toBe(false);
  });
});
