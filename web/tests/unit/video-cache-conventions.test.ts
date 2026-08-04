import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

/**
 * Two Bunny reads exist on purpose, and swapping one for the other is a silent
 * bug rather than a type error — both have the same signature.
 *
 *  - `getBunnyVideo` is uncached. `attachVideo` calls it to confirm a video
 *    really exists before pointing a lesson at it. The author has usually just
 *    finished uploading, so a cached 404 from moments earlier would reject a
 *    video that is plainly there — and the error text ("No video found with id
 *    …") would send them looking in the wrong place entirely.
 *  - `getBunnyVideoCached` is for display. The builder reads one video per video
 *    lesson on every render, and those are the calls worth collapsing.
 *
 * So: the write path must stay fresh, and the render path must stay cached.
 */
const R = (p: string) => readFileSync(join(process.cwd(), p), 'utf8');

const BUILDER = 'src/app/t/[slug]/admin/courses/[courseId]/builder';
const VIDEO_LIB = R('src/lib/video.ts');

describe('the two Bunny reads stay in their lanes', () => {
  it('both reads exist and are distinct', () => {
    expect(VIDEO_LIB).toMatch(/export async function getBunnyVideo\(/);
    expect(VIDEO_LIB).toMatch(/export const getBunnyVideoCached = cache\(/);
  });

  it('the cached read actually caches — per request and across them', () => {
    // `cache()` alone only dedupes within one render pass; the cross-request
    // sharing is what removes the repeat cost of revisiting the builder.
    const cached = VIDEO_LIB.slice(VIDEO_LIB.indexOf('export const getBunnyVideoCached'));
    const body = cached.slice(0, cached.indexOf(');') + 2);
    expect(body).toContain('cache(');
    expect(body).toMatch(/BUNNY_DETAILS_REVALIDATE_SEC|revalidate/);
    expect(VIDEO_LIB).toMatch(/const BUNNY_DETAILS_REVALIDATE_SEC = \d+;/);
  });

  it('attachVideo verifies against a FRESH read, never the cached one', () => {
    const actions = R(`${BUILDER}/actions.ts`);
    expect(
      actions,
      'attachVideo must not use getBunnyVideoCached — a stale 404 rejects a just-uploaded video',
    ).not.toContain('getBunnyVideoCached');
    expect(actions).toContain('await getBunnyVideo(id)');
  });

  it('the builder page uses the cached read for its per-lesson lookups', () => {
    const page = R(`${BUILDER}/page.tsx`);
    expect(page).toContain('getBunnyVideoCached(');
    expect(
      /await getBunnyVideo\(/.test(page),
      'the builder renders one lookup per video lesson; those must be cached',
    ).toBe(false);
  });
});

describe('bunnyFetch cache policy', () => {
  it('is uncached unless a caller opts in', () => {
    // Before this change `cache: 'no-store'` was hardcoded after `...init`, so
    // no caller could opt in at all. The default must stay uncached, though:
    // everything but the builder's display reads wants the truth.
    expect(VIDEO_LIB).toMatch(/revalidate === undefined \? \{ cache: 'no-store'/);
  });

  it("never sets both no-store and revalidate, which Next won't accept", () => {
    const fn = VIDEO_LIB.slice(
      VIDEO_LIB.indexOf('async function bunnyFetch'),
      VIDEO_LIB.indexOf('async function bunnyFetch') + 900,
    );
    // A ternary picks one or the other. Two unconditional spreads would mean both.
    expect(fn).not.toMatch(/cache: 'no-store',[\s\S]*next: \{ revalidate/);
  });
});
