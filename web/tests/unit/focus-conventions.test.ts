import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SRC = join(process.cwd(), 'src');
const read = (p: string) => readFileSync(p, 'utf8').replace(/\r\n/g, '\n');
const stripComments = (s: string) =>
  s
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
const rel = (f: string) => relative(SRC, f).split(/[\\/]/).join('/');
const CSS = read(join(SRC, 'app/globals.css')).replace(/\/\*[\s\S]*?\*\//g, '');

/**
 * There is exactly ONE focus treatment in this app: the global :focus-visible block in
 * globals.css, a 2px --color-focus outline at 2px offset. It is the only one that reaches
 * every focusable thing — links, summaries and [tabindex] elements included, none of
 * which the UI kit styles at all.
 *
 * The shadcn-derived kit shipped its own competing rings. Measured with real keyboard
 * focus: a Button painted a white 2px offset, a #171717 4px ring AND the blue outline
 * outside that — three visual bands in two colours on one control.
 *
 * Worth recording how this was misdiagnosed. An earlier pass measured the ring as
 * "transparent" and concluded the kit's rings rendered nothing. That reading was taken
 * while the DOCUMENT did not have focus, so :focus-visible never matched and the
 * box-shadow was the unfocused baseline. The rings worked the whole time; the
 * measurement did not.
 */
describe('one focus treatment, not two', () => {
  it('the global rule still exists and draws a visible outline', () => {
    /*
     * This asserted var(--color-brand-500). Under sb-ui that token is ink
     * (#1b1b1e) — the same colour as the text and as every primary button — so
     * keeping the assertion would have let the app's ONLY focus indicator go
     * ink-on-ink while the test stayed green. The focus colour now has its own
     * token precisely so a palette change cannot reach it.
     */
    const block = CSS.slice(CSS.indexOf('a:focus-visible'), CSS.indexOf('.sr-only'));
    expect(block).toMatch(/outline:\s*2px solid var\(--color-focus\)/);
    expect(block).toMatch(/outline-offset:/);
  });

  it('and the focus colour is distinguishable from ink, which is what it sits on', () => {
    // Blue is otherwise links-only; the focus ring is the system's one sanctioned
    // exception (GUIDELINES.md §1) and this is why it earns it.
    const focus = /--color-focus:\s*(#[0-9a-fA-F]{6})/.exec(CSS)?.[1];
    const ink = /--color-primary:\s*(#[0-9a-fA-F]{6})/.exec(CSS)?.[1];
    expect(focus, '--color-focus is gone').toBeTruthy();
    expect(focus, 'the focus ring is the same colour as the primary button it outlines').not.toBe(
      ink,
    );
  });

  it('nothing declares a competing focus ring', () => {
    const offenders: string[] = [];
    for (const f of FILES) {
      const src = stripComments(read(f));
      for (const m of src.matchAll(/focus-visible:ring[^\s"']*/g)) {
        offenders.push(`${rel(f)} — ${m[0]}`);
      }
    }
    expect(
      offenders,
      `the global outline is the focus indicator; these add a second:\n${offenders.join('\n')}`,
    ).toEqual([]);
  });

  it('and nothing suppresses the global outline to make room for one', () => {
    // `focus-visible:outline-none` existed only to clear the way for the kit's rings.
    // With the rings gone it can only subtract.
    const offenders: string[] = [];
    for (const f of FILES) {
      if (/focus-visible:outline-none/.test(stripComments(read(f)))) offenders.push(rel(f));
    }
    expect(offenders, offenders.join('\n')).toEqual([]);
  });

  it('a stray ring WIDTH with no colour would be worse than none', () => {
    /*
     * The exact regression this pass introduced and then caught by measuring: removing
     * `focus-visible:ring-ring/50` while leaving `focus-visible:ring-[3px]` left a
     * width with no colour, so it fell back to currentColor and painted an OPAQUE
     * near-black ring — worse than the translucent one it replaced. The cause was a
     * regex using a word boundary after `]`, which never matches.
     */
    const offenders: string[] = [];
    for (const f of FILES) {
      const src = stripComments(read(f));
      for (const m of src.matchAll(/ring-\[[^\]]*px[^\]]*\]/g)) {
        offenders.push(`${rel(f)} — ${m[0]} (width with no colour falls back to currentColor)`);
      }
    }
    expect(offenders, offenders.join('\n')).toEqual([]);
  });

  it('the complementary border signal on fields is kept', () => {
    // Not a duplicate indicator: the field's own boundary darkens, which reads as
    // "this is the one you are typing in" alongside the outline.
    for (const f of ['src/components/ui/input.tsx', 'src/components/ui/textarea.tsx']) {
      expect(stripComments(read(join(process.cwd(), f)))).toMatch(/focus-visible:border-ring/);
    }
  });
});
