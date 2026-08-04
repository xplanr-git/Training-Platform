import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, existsSync, statSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';

/**
 * Every page that waits on the server must have something to wait inside.
 *
 * Without a `loading.tsx`, Next keeps rendering the PREVIOUS page until the new
 * one is completely ready — so a click produces no visible response at all. That
 * was a real complaint ("everything takes very long to load, there is no feedback
 * if something is happening"), and the cause was structural rather than slow
 * queries: nothing was reacting to the navigation.
 *
 * A `loading.tsx` in an ancestor segment counts — Next walks up.
 */
const APP = join(process.cwd(), 'src/app');

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

const files = walk(APP);
const pages = files.filter((f) => f.endsWith('page.tsx'));
const loadings = files.filter((f) => f.endsWith('loading.tsx'));

/** Does this page, or any segment above it, provide a loading state? */
function hasLoadingBoundary(page: string): boolean {
  let dir = dirname(page);
  while (dir.startsWith(APP)) {
    if (existsSync(join(dir, 'loading.tsx'))) return true;
    dir = dirname(dir);
  }
  return false;
}

/** A page that queries the database, or awaits a helper that does. */
function fetchesServerData(src: string): boolean {
  if (src.includes('use client')) return false;
  return /await db|await get[A-Z]|await resolve[A-Z]|await load[A-Z]|from\(/.test(src);
}

describe('pages that fetch on the server have a loading state', () => {
  it('finds the app tree', () => {
    expect(pages.length).toBeGreaterThan(15);
    expect(loadings.length).toBeGreaterThan(5);
  });

  it('every server-fetching page is covered by a loading boundary', () => {
    const uncovered = pages
      .filter((p) => fetchesServerData(readFileSync(p, 'utf8')))
      .filter((p) => !hasLoadingBoundary(p))
      .map((p) => relative(APP, p).replace(/\\/g, '/'));

    expect(
      uncovered,
      `add a loading.tsx beside (or above) these, or the click shows nothing:\n${uncovered.join('\n')}`,
    ).toEqual([]);
  });
});

describe('loading states reuse the design system', () => {
  it('no loading file hand-rolls a pulse; they all use the Skeleton primitive', () => {
    // The primitive already existed and was unused, so the first two loading
    // states hand-rolled `animate-pulse bg-surface-muted` divs — a second,
    // slightly-different visual language for the same idea.
    const offenders = loadings
      .filter((f) => {
        const src = readFileSync(f, 'utf8');
        const rollsItsOwn = src.includes('animate-pulse');
        const usesPrimitive = /Skeleton|skeletons'/.test(src);
        return rollsItsOwn || !usesPrimitive;
      })
      .map((f) => relative(APP, f).replace(/\\/g, '/'));

    expect(offenders, `use <Skeleton> / @/components/skeletons:\n${offenders.join('\n')}`).toEqual(
      [],
    );
  });

  it('each loading state announces itself to a screen reader', () => {
    const silent = loadings
      .filter((f) => {
        const src = readFileSync(f, 'utf8');
        return !src.includes('aria-busy') && !src.includes('sr-only');
      })
      .map((f) => relative(APP, f).replace(/\\/g, '/'));
    expect(silent, `add aria-busy and an sr-only label:\n${silent.join('\n')}`).toEqual([]);
  });
});
