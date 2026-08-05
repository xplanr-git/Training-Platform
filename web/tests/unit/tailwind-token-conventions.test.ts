import { describe, it, expect } from 'vitest';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

/**
 * The bug this exists to prevent, because nothing else catches it.
 *
 * `rounded-[--radius-card]` compiles, lints, typechecks and builds without a
 * murmur — and emits `border-radius: --radius-card`, which is not valid CSS, so
 * the browser drops the declaration. Thirty occurrences across nineteen files had
 * a computed border-radius of 0px: every admin table, the accordion, the skeletons,
 * and four components written in this very backlog. Verified in a browser against
 * the served stylesheet, not inferred.
 *
 * In Tailwind v4 a bare custom property needs the parenthesis shorthand —
 * `rounded-(--radius-card)` → `border-radius: var(--radius-card)` — or the explicit
 * `rounded-[var(--radius-card)]`. The square-bracket-without-var form is always
 * wrong and always silent.
 */
const SRC = join(process.cwd(), 'src');

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) out.push(...walk(full));
    else if (/\.(tsx?|css)$/.test(full)) out.push(full);
  }
  return out;
}

const files = walk(SRC);
const rel = (f: string) => relative(SRC, f).replace(/\\/g, '/');

describe('no utility passes a bare custom property through square brackets', () => {
  it('finds the source tree', () => {
    expect(files.length).toBeGreaterThan(40);
  });

  it('every arbitrary value that is a CSS variable is wrapped or uses ( )', () => {
    const offenders: string[] = [];
    for (const f of files) {
      const src = readFileSync(f, 'utf8');
      // `foo-[--bar]` — a utility whose arbitrary value starts with `--` and is not
      // wrapped in var(). This is the exact shape that emits invalid CSS.
      for (const m of src.matchAll(/[a-z][a-z0-9-]*-\[(--[a-zA-Z0-9-]+)\]/g)) {
        const line = src.slice(0, m.index ?? 0).split('\n').length;
        offenders.push(`${rel(f)}:${line} — ${m[0]}  (use the ( ) form or [var(${m[1]})])`);
      }
    }
    expect(
      offenders,
      `these emit invalid CSS and are silently dropped by the browser:\n${offenders.join('\n')}`,
    ).toEqual([]);
  });
});

describe('--color-muted is a text colour, not a surface', () => {
  /*
   * `bg-muted/50` on TableRow's hover composited to roughly #b5b8bf over white, and
   * the muted cell text sitting on it measured about 2.4:1 — well under AA. The
   * token is #6b7280, the grey used for secondary TEXT. Surfaces are `--color-surface`
   * and `--color-surface-muted`. Every other hover in the app already uses
   * `hover:bg-surface-muted`.
   */
  it('nothing uses bg-muted as a fill', () => {
    const offenders: string[] = [];
    for (const f of files) {
      const src = readFileSync(f, 'utf8');
      for (const m of src.matchAll(/\b(?:hover:|data-\[[^\]]*\]:|focus:)?bg-muted(?:\/\d+)?\b/g)) {
        // `bg-muted-foreground` and `bg-surface-muted` are different tokens.
        if (/bg-muted-|bg-surface-muted/.test(m[0])) continue;
        const line = src.slice(0, m.index ?? 0).split('\n').length;
        offenders.push(`${rel(f)}:${line} — ${m[0]}`);
      }
    }
    expect(
      offenders,
      `use bg-surface-muted; --color-muted is #6b7280 text grey:\n${offenders.join('\n')}`,
    ).toEqual([]);
  });
});

describe('a border always names its colour', () => {
  /*
   * Tailwind v4's preflight sets `border-style: solid; border-width: 0`, so the
   * `border` utility supplies width but leaves the colour at `currentColor`. Card
   * had `rounded-xl border` and nothing else, so every card in the app drew a 1px
   * near-black #0a0a0a border instead of the #e5e7eb token — measured in a browser.
   */
  const PRIMITIVES = ['src/components/ui/card.tsx', 'src/components/ui/table.tsx'];

  it('the primitives that draw borders specify a border colour', () => {
    for (const p of PRIMITIVES) {
      const src = readFileSync(join(process.cwd(), p), 'utf8');
      // Either quote style: the repo is single-quoted, and hardcoding `"` here
      // made this guard silently stop finding anything the moment prettier
      // normalised the primitives.
      for (const m of src.matchAll(/['"]([^'"]*\bborder\b[^'"]*)['"]/g)) {
        /*
         * Consider only BARE tokens on the element itself. Two things had to be
         * excluded, and both were this test's own false positives against code that
         * was already correct:
         *   - `[.border-b]:pb-6` is a variant SELECTOR, not a border utility.
         *   - `[&_tr]:border-b` styles a descendant, and that descendant (TableRow)
         *     supplies the colour itself.
         * What is left is the real defect: `border` sitting on a component's root
         * class list with no colour token beside it.
         */
        const tokens = m[1]
          .replace(/\[[^\]]*\]/g, '')
          .split(/\s+/)
          .filter((t) => t && !t.includes(':'));
        const hasBareWidth = tokens.some((t) => /^border(-[btlrxy])?$/.test(t));
        const hasColour = tokens.some((t) =>
          /^border-(border|input|ring|brand-\d+|destructive|amber-\d+|transparent)$/.test(t),
        );
        if (hasBareWidth && !hasColour) {
          expect.fail(
            `${p} — "${m[1]}" draws a border with no colour, so it inherits currentColor`,
          );
        }
      }
    }
  });
});
