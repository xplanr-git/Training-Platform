import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative, resolve } from 'node:path';

const SRC = resolve(process.cwd(), 'src');

function walk(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir)) {
    const f = join(dir, e);
    if (statSync(f).isDirectory()) walk(f, out);
    else if (/\.tsx?$/.test(f)) out.push(f);
  }
  return out;
}
const rel = (f: string) => relative(process.cwd(), f).split(/[\\/]/).join('/');
/** Comments stripped — guards in this repo have been satisfied by their own prose five times. */
const code = (f: string) =>
  readFileSync(f, 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

/**
 * A time estimate must never claim more precision than it has.
 *
 * `lessons.estimated_minutes` is nullable and optional, so any sum over lessons
 * can cover only some of them. Every render site said "about N min left"
 * regardless — so three lessons left with one estimated at 20 minutes told the
 * learner "about 20 min left" for 20 minutes plus two lessons of unknown length.
 * It under-reported, and nothing on screen hinted the figure was partial.
 *
 * This walks src/ rather than checking the three known sites: the point is to
 * catch the FOURTH one somebody adds. Two independent sums exist already (the
 * shared derivation for "left", and the course landing page's own total for
 * course length), which is exactly how a third would appear unnoticed.
 */
const renderSites = walk(SRC).filter((f) => /\bformatMinutes\s*\(/.test(code(f)));

describe('a partial time estimate is never presented as a precise one', () => {
  it('there are render sites to check', () => {
    // If this drops to zero the rest of the file passes vacuously.
    expect(renderSites.length).toBeGreaterThanOrEqual(3);
  });

  it('no site hardcodes "about" in front of a minute figure', () => {
    const offenders = renderSites
      .filter((f) => /(about|roughly|approx\.?)\s*\$\{\s*formatMinutes/.test(code(f)))
      .map(rel);
    expect(
      offenders,
      `these claim precision the estimate may not have — branch on a partial flag:\n${offenders.join('\n')}`,
    ).toEqual([]);
  });

  it('every site that prints a minute figure decides its wording from a partial flag', () => {
    const offenders = renderSites
      // lib/progress.ts is the re-export barrel; it forwards formatMinutes but renders nothing.
      .filter((f) => !/src[\\/]lib[\\/]progress\.ts$/.test(f))
      .filter((f) => !/(minutesLeftIsPartial|minutesArePartial)/.test(code(f)))
      .map(rel);
    expect(
      offenders,
      `these render a minute figure with no way to know it is partial:\n${offenders.join('\n')}`,
    ).toEqual([]);
  });

  it('the derivation still exposes the flag the render sites read', () => {
    const derive = code(join(SRC, 'lib', 'progress-derive.ts'));
    expect(derive).toMatch(/minutesLeftIsPartial:\s*boolean/);
    // Against REMAINING, not total: hedging on total would under-sell a course
    // whose only un-estimated lessons are already finished.
    expect(derive).toMatch(/estimates\.length\s*<\s*remaining\.length/);
  });
});
