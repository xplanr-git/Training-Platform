import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SRC = join(process.cwd(), 'src');
const rel = (f: string) => relative(SRC, f).replace(/\\/g, '/');
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

/**
 * The system's ramp is a closed set of NAMED roles — display 32 / h1 24 / h2 19 /
 * h3 15 / body 14 / control 13.5 / meta 12.5 / eyebrow 11 — and every one has a
 * token. Reaching past them re-introduces the sizes the ramp exists to remove.
 *
 * `text-xs` is the specific trap: Tailwind's default is 12px, the system's meta is
 * 12.5. It looks correct, is off by half a pixel, and appeared at 47 sites.
 */
describe('type sizes come from the named ramp', () => {
  it('no file reaches for Tailwind text-xs instead of the meta token', () => {
    const offenders: string[] = [];
    for (const f of FILES) {
      for (const _ of code(f).matchAll(/\btext-xs\b/g)) offenders.push(rel(f));
    }
    expect(
      [...new Set(offenders)],
      "text-xs is 12px; the system's meta is 12.5px — use text-meta",
    ).toEqual([]);
  });

  it('no file invents an arbitrary pixel size', () => {
    // text-[11px] was the eyebrow written out longhand, and text-[12.5px] was meta.
    // Both had tokens; using the literal detaches the site from the ramp.
    const offenders: string[] = [];
    for (const f of FILES) {
      for (const m of code(f).matchAll(/text-\[[0-9.]+px\]/g)) offenders.push(`${rel(f)} ${m[0]}`);
    }
    expect(offenders, 'use a ramp token: text-display/h1/h2/h3/body/control/meta/eyebrow').toEqual(
      [],
    );
  });

  it('the guard is scanning a real tree', () => {
    // A walk that resolved to nothing would let both tests above pass silently.
    expect(FILES.length).toBeGreaterThan(50);
  });
});

describe('codes are set in the system face, not monospace', () => {
  it('nothing renders a code in font-mono', () => {
    /*
     * "No monospace for money/codes" (CLAUDE.md §13 rule 5). /verify already
     * renders the verification code as sans + tabular and carries a comment
     * explaining why — but the video id in attached-video and the error digest in
     * segment-error were still font-mono, so the same class of value was set two
     * different ways in one product.
     */
    const offenders: string[] = [];
    for (const f of FILES) {
      if (/\bfont-mono\b/.test(code(f))) offenders.push(rel(f));
    }
    expect(offenders, 'use tabular-nums + tracking-wide in the system face').toEqual([]);
  });
});
