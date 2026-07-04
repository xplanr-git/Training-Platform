import { describe, it, expect } from 'vitest';
import { deriveProgress } from '@/lib/progress-derive';

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
});
