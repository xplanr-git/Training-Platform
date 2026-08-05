import { describe, it, expect } from 'vitest';
import { deriveProgress, formatMinutes } from '@/lib/progress-derive';

describe('deriveProgress', () => {
  const lessons = ['a', 'b', 'c', 'd'];

  it('computes percent and done from completed ids', () => {
    const p = deriveProgress(['a', 'b'], lessons);
    expect(p.done).toBe(2);
    expect(p.total).toBe(4);
    expect(p.percent).toBe(50);
    expect(p.isComplete).toBe(false);
  });

  it('is complete only when all lessons are done', () => {
    expect(deriveProgress(['a', 'b', 'c', 'd'], lessons).isComplete).toBe(true);
    expect(deriveProgress(['a', 'b', 'c'], lessons).isComplete).toBe(false);
  });

  it('ignores completed ids not in the course (stale/removed lessons)', () => {
    const p = deriveProgress(['a', 'zzz'], lessons);
    expect(p.done).toBe(1);
    expect(p.percent).toBe(25);
  });

  it('an empty course is never complete and reads 0%', () => {
    const p = deriveProgress([], []);
    expect(p.percent).toBe(0);
    expect(p.isComplete).toBe(false);
  });

  it('deduplicates repeated completion events', () => {
    const p = deriveProgress(['a', 'a', 'a'], lessons);
    expect(p.done).toBe(1);
  });

  it('reports no time estimate when lessons are passed as bare ids', () => {
    expect(deriveProgress(['a'], lessons).minutesLeft).toBeNull();
  });
});

describe('deriveProgress — estimated minutes left', () => {
  const timed = [
    { id: 'a', estimatedMinutes: 10 },
    { id: 'b', estimatedMinutes: 5 },
    { id: 'c', estimatedMinutes: 15 },
  ];

  it('sums estimates for incomplete lessons only', () => {
    expect(deriveProgress([], timed).minutesLeft).toBe(30);
    expect(deriveProgress(['a'], timed).minutesLeft).toBe(20);
    expect(deriveProgress(['a', 'c'], timed).minutesLeft).toBe(5);
  });

  it('is null once everything is complete', () => {
    expect(deriveProgress(['a', 'b', 'c'], timed).minutesLeft).toBeNull();
  });

  it('counts only the remaining lessons that carry an estimate', () => {
    const mixed = [
      { id: 'a', estimatedMinutes: 10 },
      { id: 'b', estimatedMinutes: null },
      { id: 'c', estimatedMinutes: 20 },
    ];
    expect(deriveProgress(['a'], mixed).minutesLeft).toBe(20);
  });

  /*
   * The figure under-reported silently. With `a` done, two lessons remain but
   * only one is estimated, so `minutesLeft` is 20 for what is 20 minutes PLUS a
   * lesson of unknown length — and the learner was told "about 20 min left". The
   * flag lets the UI say "at least", which is true.
   */
  describe('minutesLeftIsPartial', () => {
    const mixed = [
      { id: 'a', estimatedMinutes: 10 },
      { id: 'b', estimatedMinutes: null },
      { id: 'c', estimatedMinutes: 20 },
    ];

    it('is false when every remaining lesson is estimated', () => {
      const p = deriveProgress([], timed);
      expect(p.minutesLeft).toBe(30);
      expect(p.minutesLeftIsPartial).toBe(false);
    });

    it('is true when only some remaining lessons are estimated', () => {
      const p = deriveProgress(['a'], mixed);
      expect(p.minutesLeft).toBe(20);
      expect(p.minutesLeftIsPartial).toBe(true);
    });

    it('is false once the UN-estimated lesson is the one completed', () => {
      // Guards the likeliest wrong implementation: comparing against TOTAL
      // lessons rather than REMAINING ones would hedge here, under-selling a
      // figure that is now complete.
      const p = deriveProgress(['b'], mixed);
      expect(p.minutesLeft).toBe(30);
      expect(p.minutesLeftIsPartial).toBe(false);
    });

    it('is false when nothing remaining is estimated, since minutesLeft is null', () => {
      const none = [
        { id: 'a', estimatedMinutes: null },
        { id: 'b', estimatedMinutes: null },
      ];
      const p = deriveProgress([], none);
      expect(p.minutesLeft).toBeNull();
      expect(p.minutesLeftIsPartial).toBe(false);
    });

    it('treats a zero or negative estimate as un-estimated, so it hedges', () => {
      // These are filtered out of the sum but still count as remaining work.
      const p = deriveProgress([], [
        { id: 'a', estimatedMinutes: 10 },
        { id: 'b', estimatedMinutes: 0 },
      ]);
      expect(p.minutesLeft).toBe(10);
      expect(p.minutesLeftIsPartial).toBe(true);
    });

    it('is false on a complete course', () => {
      const p = deriveProgress(['a', 'b', 'c'], mixed);
      expect(p.minutesLeft).toBeNull();
      expect(p.minutesLeftIsPartial).toBe(false);
    });
  });

  it('is null when no remaining lesson has an estimate (UI falls back)', () => {
    const none = [
      { id: 'a', estimatedMinutes: null },
      { id: 'b', estimatedMinutes: null },
    ];
    expect(deriveProgress([], none).minutesLeft).toBeNull();
  });

  it('ignores zero / negative / non-finite estimates', () => {
    const bad = [
      { id: 'a', estimatedMinutes: 0 },
      { id: 'b', estimatedMinutes: -5 },
      { id: 'c', estimatedMinutes: Number.NaN },
      { id: 'd', estimatedMinutes: 7 },
    ];
    expect(deriveProgress([], bad).minutesLeft).toBe(7);
  });
});

describe('formatMinutes', () => {
  it('renders minutes under an hour', () => {
    expect(formatMinutes(1)).toBe('1 min');
    expect(formatMinutes(45)).toBe('45 min');
    expect(formatMinutes(59)).toBe('59 min');
  });

  it('renders whole hours without stray minutes', () => {
    expect(formatMinutes(60)).toBe('1 h');
    expect(formatMinutes(120)).toBe('2 h');
  });

  it('renders hours plus minutes', () => {
    expect(formatMinutes(90)).toBe('1 h 30 min');
    expect(formatMinutes(135)).toBe('2 h 15 min');
  });

  it('never renders a negative time', () => {
    expect(formatMinutes(-10)).toBe('0 min');
  });
});
