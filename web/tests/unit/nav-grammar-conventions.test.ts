import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const CSS = read('src/app/globals.css');
const SHELL = read('src/components/admin-shell.tsx');

/**
 * The className string of a side-nav row, comments stripped.
 *
 * Bounded at the end of the `<Link …>` opening tag. A wider slice silently
 * swallowed the "Soon" badge and the mobile drawer trigger, which carry a
 * legitimate `rounded-sm`, `py-0.5` and `hover:bg-` of their own — so the first
 * version of this test failed against a nav that was already correct.
 */
function navLinkClasses(): string {
  const src = SHELL.replace(/\/\/.*$/gm, '');
  const start = src.indexOf("'flex items-center justify-between");
  expect(start, 'could not find the nav row className').toBeGreaterThan(-1);
  const end = src.indexOf('>', start);
  expect(end, 'could not find the end of the Link tag').toBeGreaterThan(start);
  return src.slice(start, end);
}

/**
 * The side menu is where the design system is most explicit, and where it was most
 * often contradicted. Guidelines §6: "Current = ink label + 1.75px underline
 * (hugging the text). Hover = the label darkens to ink (rows may take a square grey
 * wash on press). No block background and no side bar for selection." §2:
 * "Navigation hover/selection is square (no radius)."
 */
describe('side-nav follows the resolved navigation grammar', () => {
  const classes = navLinkClasses();

  it('is square — no radius on a nav row', () => {
    // rounded-md gave every row a 4px pill on hover, which is precisely the
    // block-selection look this grammar exists to avoid.
    expect(classes).not.toMatch(/\brounded-/);
  });

  it('darkens the label on hover rather than filling the row', () => {
    expect(classes, 'hover should change the text colour').toMatch(/hover:text-foreground/);
    expect(classes, 'a background wash on hover reads as "selected", not "hovered"').not.toMatch(
      /hover:bg-/,
    );
  });

  it('keeps the wash for press, where the system allows it', () => {
    expect(classes).toMatch(/active:bg-/);
  });

  it('marks the current item with an underline, not a block or a side bar', () => {
    const src = SHELL.replace(/\/\/.*$/gm, '');
    expect(src).toMatch(/underline decoration-primary/);
    expect(src, 'a left bar is the forbidden side-bar treatment').not.toMatch(/border-l-2/);
  });

  it('uses the named control size, not body size', () => {
    // 13.5 is the system's standard interactive/label size; the nav sat at
    // text-sm (14) only because no token existed for it.
    expect(classes).toMatch(/\btext-control\b/);
    expect(CSS).toMatch(/--text-control:\s*0\.84375rem/);
  });

  it('spaces the row on the scale', () => {
    // 4·8·12·16·20·24·32·40 only — "do not invent intermediate values" (§2).
    // px-2.5 is 10px and px-1.5 is 6px; neither is on it.
    const offScale = /\b(?:p|px|py|m|mx|my|gap)-(?:0\.5|1\.5|2\.5|3\.5)\b/.exec(classes);
    expect(offScale?.[0], `off the spacing scale: ${offScale?.[0]}`).toBeUndefined();
  });
});

describe('motion respects the reduced-motion preference', () => {
  it('globals.css disables animation and transition under reduce', () => {
    /*
     * Required outright by the system: "All transitions respect
     * prefers-reduced-motion" (§7) and "Everything is disabled under
     * prefers-reduced-motion: reduce" (§8). There was no handling anywhere —
     * zero occurrences across src/ — against 17 transition-colors, two
     * animate-spin and the animate-pulse skeletons.
     *
     * The skeletons make it a real accessibility item: every admin navigation
     * shows a large pulsing block for about a second, and a repeating pulse over
     * a large area is the pattern that triggers vestibular symptoms.
     */
    expect(CSS).toMatch(/@media\s*\(prefers-reduced-motion:\s*reduce\)/);
    const block = CSS.slice(CSS.indexOf('@media (prefers-reduced-motion: reduce)'));
    expect(block).toMatch(/animation-duration:\s*0\.01ms\s*!important/);
    expect(block).toMatch(/transition-duration:\s*0\.01ms\s*!important/);
    // Near-zero rather than none: a 0s transition can skip transitionend, which
    // some libraries wait on before cleaning up.
    expect(block).not.toMatch(/transition:\s*none/);
  });
});
