import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { formatDateLong, formatDateShort, formatCount } from '../../src/lib/format-date';

const SRC = join(process.cwd(), 'src');
const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
/** Comments stripped: a guard must judge what renders, not what documents it. */
const code = (p: string) =>
  read(p)
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const e of readdirSync(dir)) {
    const f = join(dir, e);
    if (statSync(f).isDirectory()) out.push(...walk(f));
    else if (/\.tsx?$/.test(f)) out.push(f);
  }
  return out;
}
const FILES = walk(SRC);
const rel = (f: string) => relative(SRC, f).replace(/\\/g, '/');

describe('human-readable dates are unambiguous', () => {
  /*
   * The bug this locks down: three sites called `toLocaleDateString()` with no
   * arguments, which inherits the RENDERER's locale. These are server components,
   * so on Vercel that resolved to en-US and a certificate issued 11 August 2026
   * printed as "8/11/2026" — read as 8 November by most of the world, on a public
   * page whose entire job is to be trusted by a third party.
   */
  it('spells the month, so no reader can transpose day and month', () => {
    const d = new Date('2026-08-11T00:00:00Z');
    expect(formatDateLong(d)).toBe('11 August 2026');
    expect(formatDateShort(d)).toBe('11 Aug 2026');
  });

  it('never emits an all-numeric date', () => {
    // The actual regression: any output matching d/m/y or m/d/y is ambiguous.
    for (const v of ['2026-08-11T00:00:00Z', '2026-01-02T00:00:00Z', '2026-12-31T00:00:00Z']) {
      expect(formatDateLong(v)).not.toMatch(/^\d{1,2}\/\d{1,2}\/\d{4}$/);
      expect(formatDateShort(v)).not.toMatch(/^\d{1,2}\/\d{1,2}\/\d{4}$/);
      expect(formatDateLong(v)).toMatch(/[A-Za-z]/);
    }
  });

  it('pins UTC, so the day cannot shift with the host timezone', () => {
    // 23:30 UTC is already "tomorrow" anywhere east of Greenwich. Formatted in the
    // host's zone this would date a certificate a day late for every AU reader.
    expect(formatDateLong('2026-08-11T23:30:00Z')).toBe('11 August 2026');
    // ...and 00:30 UTC is still "yesterday" in the Americas.
    expect(formatDateLong('2026-08-11T00:30:00Z')).toBe('11 August 2026');
  });

  it('accepts Date, string and epoch alike', () => {
    const iso = '2026-08-11T00:00:00Z';
    const expected = '11 August 2026';
    expect(formatDateLong(new Date(iso))).toBe(expected);
    expect(formatDateLong(iso)).toBe(expected);
    expect(formatDateLong(Date.parse(iso))).toBe(expected);
  });

  it('degrades to an em dash rather than "Invalid Date"', () => {
    expect(formatDateLong(null)).toBe('—');
    expect(formatDateLong(undefined)).toBe('—');
    expect(formatDateLong('not a date')).toBe('—');
    expect(formatDateShort(null)).toBe('—');
  });
});

describe('grouped numbers are host-independent too', () => {
  it('groups with commas regardless of the host locale', () => {
    expect(formatCount(5000)).toBe('5,000');
    expect(formatCount(500)).toBe('500');
    expect(formatCount(1234567)).toBe('1,234,567');
  });

  it('degrades rather than printing NaN', () => {
    expect(formatCount(Number.NaN)).toBe('—');
    expect(formatCount(Number.POSITIVE_INFINITY)).toBe('—');
  });
});

describe('no site reintroduces a locale-dependent date', () => {
  /*
   * A guard, not a style preference. `toLocaleDateString()` with no arguments is
   * silently correct on a developer's machine (en-AU/en-GB) and silently wrong in
   * production (en-US on Vercel), which is exactly the class of bug that survives
   * review. Route dates through lib/format-date.ts instead.
   */
  it('calls no bare toLocale*String() anywhere in src', () => {
    const offenders: string[] = [];
    for (const f of FILES) {
      if (rel(f) === 'lib/format-date.ts') continue;
      const src = code(f);
      // Zero-argument calls only. An explicit locale is fine.
      const re = /\.toLocale(?:Date|Time)?String\(\s*\)/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(src))) {
        const line = src.slice(0, m.index).split('\n').length;
        offenders.push(`${rel(f)}:${line} ${m[0]}`);
      }
    }
    expect(
      offenders,
      'Use formatDateLong / formatDateShort / formatCount from lib/format-date.ts — a ' +
        'zero-argument toLocale*String() inherits the renderer locale, which differs ' +
        'between a dev machine and Vercel.',
    ).toEqual([]);
  });
});
