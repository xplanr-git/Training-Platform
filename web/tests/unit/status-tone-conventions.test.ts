import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { token, ratio, AA_NORMAL_TEXT } from './helpers/contrast';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const BADGE = read('src/components/ui/badge.tsx');
const CSS = read('src/app/globals.css').replace(/\/\*[\s\S]*?\*\//g, '');

const TONES = ['green', 'amber', 'red', 'blue', 'grey'] as const;

/**
 * Status tags are the one place colour carries meaning in a monochrome system,
 * which makes them the one place colour can quietly stop working.
 */
describe('every status tone is readable on its own tint', () => {
  it.each(TONES)('%s clears AA', (tone) => {
    const fg = token(`--color-status-${tone}`);
    const bg = token(`--color-status-${tone}-bg`);
    const r = ratio(fg, bg);
    expect(r, `status-${tone} on its tint is ${r.toFixed(2)}:1`).toBeGreaterThanOrEqual(
      AA_NORMAL_TEXT,
    );
  });
});

describe('the tints are opaque, and that is load-bearing', () => {
  /*
   * sb-ui ships these as ~11% alpha of the text colour. A translucent tint takes
   * its contrast from whatever is behind it, and these tags appear on white
   * tables, on the #fcfcfb shell AND on the #f1f1f0 sunken admin background.
   * Measured with the alpha values: green composited to 4.43:1 on sunken — under
   * AA — while the identical tag measured 4.99:1 two panels away.
   *
   * The failure mode this guards is subtle: reintroducing the alpha would look
   * correct everywhere anyone thought to check, and fail only on the sunken
   * plane. So assert the shape, not just the ratio.
   */
  it.each(TONES)('status-%s-bg is a solid hex, not an alpha of the text colour', (tone) => {
    const decl = new RegExp(`--color-status-${tone}-bg:\\s*([^;]+);`).exec(CSS)?.[1]?.trim();
    expect(decl, `--color-status-${tone}-bg is missing`).toBeTruthy();
    expect(decl, `use a composited hex, not ${decl}`).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('and they still clear AA on the surface they sit on, whichever it is', () => {
    // The tag itself is opaque, so this is really asserting the tint is
    // distinguishable from every plane it can land on — otherwise the tag reads
    // as plain text and the dot is doing all the work alone.
    for (const tone of TONES) {
      const bg = token(`--color-status-${tone}-bg`);
      for (const surface of ['--color-card', '--color-surface', '--color-sunken']) {
        const r = ratio(bg, token(surface));
        expect(
          r,
          `status-${tone} tint is invisible on ${surface} (${r.toFixed(2)}:1)`,
        ).toBeLessThan(1.9);
      }
    }
  });
});

describe('status is never colour alone (WCAG 1.4.1)', () => {
  it('StatusBadge renders a dot as well as a label', () => {
    expect(BADGE, 'the dot is the non-colour channel').toMatch(/rounded-full bg-current/);
    expect(BADGE, 'and it is decorative — the label carries the meaning').toMatch(
      /aria-hidden="true"[^>]*rounded-full bg-current|rounded-full bg-current[^>]*aria-hidden/s,
    );
  });

  it('the label is a child, not a colour-coded blank', () => {
    expect(BADGE).toMatch(/\{children\}/);
  });

  it('tags are squared, not pills', () => {
    // rounded-sm is the 2px tag radius; rounded-full here would be the fluffy
    // pill GUIDELINES.md §9 lists first among the "AI-generated" tells.
    const status = BADGE.slice(BADGE.indexOf('function StatusBadge'));
    expect(status).toMatch(/rounded-sm/);
    expect(status.replace(/rounded-full bg-current/g, ''), 'only the dot is round').not.toMatch(
      /rounded-full/,
    );
  });
});
