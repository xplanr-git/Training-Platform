import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parsePage, pageMeta, PAGE_SIZE } from '@/lib/pagination';

describe('parsePage', () => {
  it('defaults to 1 for undefined / invalid / non-positive input', () => {
    expect(parsePage(undefined)).toBe(1);
    expect(parsePage('')).toBe(1);
    expect(parsePage('abc')).toBe(1);
    expect(parsePage('0')).toBe(1);
    expect(parsePage('-3')).toBe(1);
  });

  it('parses positive integers, flooring decimals', () => {
    expect(parsePage('2')).toBe(2);
    expect(parsePage('10')).toBe(10);
    expect(parsePage('3.9')).toBe(3);
  });
});

describe('pageMeta', () => {
  it('reports a single empty page when there are no rows', () => {
    const m = pageMeta(1, 0);
    expect(m.pageCount).toBe(1);
    expect(m.page).toBe(1);
    expect(m.offset).toBe(0);
    expect(m.hasPrev).toBe(false);
    expect(m.hasNext).toBe(false);
  });

  it('computes offset and page count for a middle page', () => {
    const m = pageMeta(2, 60, 25);
    expect(m.pageCount).toBe(3);
    expect(m.page).toBe(2);
    expect(m.offset).toBe(25);
    expect(m.limit).toBe(25);
    expect(m.hasPrev).toBe(true);
    expect(m.hasNext).toBe(true);
  });

  it('clamps an out-of-range page to the last page', () => {
    const m = pageMeta(99, 60, 25);
    expect(m.page).toBe(3);
    expect(m.offset).toBe(50);
    expect(m.hasNext).toBe(false);
    expect(m.hasPrev).toBe(true);
  });

  it('uses the default PAGE_SIZE when none is given', () => {
    const m = pageMeta(1, PAGE_SIZE * 2);
    expect(m.limit).toBe(PAGE_SIZE);
    expect(m.pageCount).toBe(2);
  });

  it('marks the last page as having no next', () => {
    const m = pageMeta(3, 60, 25);
    expect(m.page).toBe(3);
    expect(m.hasNext).toBe(false);
  });
});

describe('pageMeta must not be used to derive an offset before the total is known', () => {
  it('clamps to page 1 when told the total is 0 — which is the trap', () => {
    // Parallelising the count and the rows tempts you to call pageMeta with a
    // provisional total of 0 to get the offset. pageMeta clamps the page against
    // pageCount, and pageCount comes from the total — so every page collapses to
    // page 1 and the first page's rows are returned for every page. Silently.
    expect(pageMeta(3, 0).offset).toBe(0);
    expect(pageMeta(3, 0).page).toBe(1);
    // With the real total it behaves correctly, which is why the bug hides.
    expect(pageMeta(3, 100).offset).toBe(50);
  });

  it('the storefront derives its offset from the requested page, not from pageMeta', () => {
    const src = readFileSync(join(process.cwd(), 'src/app/t/[slug]/page.tsx'), 'utf8');
    expect(src).toMatch(/const requestedOffset = \(requestedPage - 1\) \* PAGE_SIZE/);
    // A provisional pageMeta call is the regression.
    expect(src).not.toMatch(/pageMeta\([^)]*,\s*0\s*\)/);
  });
});
