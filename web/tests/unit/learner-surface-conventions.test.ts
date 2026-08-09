import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');

/** The four surfaces a dealer sees, plus the dashboard they land on. */
const LEARNER_SURFACES = [
  'src/app/t/[slug]/page.tsx',
  'src/app/t/[slug]/courses/[courseSlug]/page.tsx',
  'src/app/t/[slug]/learn/[courseSlug]/page.tsx',
  'src/app/t/[slug]/learn/[courseSlug]/[lessonId]/page.tsx',
  'src/app/t/[slug]/dashboard/page.tsx',
];

/** Page shells that own the whole viewport. The player nests inside a layout. */
const PAGE_SHELLS = LEARNER_SURFACES.filter((f) => !f.endsWith('[lessonId]/page.tsx'));

const CSS = read('src/app/globals.css');

describe('keyboard focus is visible, and only globals.css makes it so', () => {
  /*
   * CORRECTION to what this comment used to say. It claimed the UI kit's
   * `focus-visible:ring-*` computed to a transparent box-shadow and therefore rendered
   * nothing. That was wrong: the reading behind it was taken while the DOCUMENT did not
   * have focus, so `:focus-visible` never matched and the box-shadow was simply the
   * unfocused baseline. Re-measured with a real keyboard Tab, a Button painted a white
   * 2px offset plus a #171717 4px ring — on top of the global blue outline. Two
   * indicators in two colours, not none.
   *
   * The kit's rings have since been removed (see focus-conventions.test.ts), so the
   * global block below IS now the single focus treatment — by design rather than by
   * accident. Delete or narrow it and focus goes invisible app-wide with nothing else
   * failing, which is what this guard is for.
   */
  const block = CSS.slice(CSS.indexOf('a:focus-visible'), CSS.indexOf('.sr-only'));

  it('covers every kind of interactive element', () => {
    for (const sel of [
      'a:focus-visible',
      'button:focus-visible',
      'input:focus-visible',
      'select:focus-visible',
      'textarea:focus-visible',
      'summary:focus-visible',
      '[tabindex]:focus-visible',
    ]) {
      expect(block, `globals.css must style ${sel}`).toContain(sel);
    }
  });

  it('draws an outline thick enough to see', () => {
    // Was var(--color-brand-500); that token is ink under sb-ui, so the focus
    // colour moved to its own --color-focus. See focus-conventions.test.ts.
    const m = /outline:\s*(\d+)px solid var\(--color-focus\)/.exec(block);
    expect(m, 'expected the focus-token outline').not.toBeNull();
    expect(Number(m?.[1] ?? 0)).toBeGreaterThanOrEqual(2);
    expect(block, 'offset it so it does not sit on the control edge').toMatch(/outline-offset:/);
  });

  it('no learner surface suppresses it without providing its own', () => {
    for (const f of LEARNER_SURFACES) {
      const src = read(f);
      const bad = [...src.matchAll(/className=(?:"|\{`)([^"`]*outline-none[^"`]*)/g)]
        .map((m) => m[1])
        .filter((c) => !/ring-|border-ring|outline-/.test(c.replace('outline-none', '')));
      expect(bad, `${f} removes the focus outline and puts nothing back`).toEqual([]);
    }
  });
});

describe('no heading is smaller than the text it heads', () => {
  // Two were `text-sm` — 14px against a 16px body. On the course landing the
  // section title was the exact same size as the lesson names it grouped, so the
  // only thing separating a heading from its contents was font weight.
  it('every heading on a learner surface is text-base or larger', () => {
    const offenders: string[] = [];
    for (const f of LEARNER_SURFACES) {
      const src = read(f);
      for (const m of src.matchAll(/<(h[1-3]|AccordionTrigger)\b([^>]*)>/g)) {
        const cls = /className="([^"]*)"/.exec(m[2])?.[1] ?? '';
        if (/\btext-(xs|sm)\b/.test(cls)) {
          const line = src.slice(0, m.index ?? 0).split('\n').length;
          offenders.push(`${f}:${line} <${m[1]}> is ${/text-(xs|sm)/.exec(cls)?.[0]}`);
        }
      }
    }
    expect(offenders, offenders.join('\n')).toEqual([]);
  });

  it('and states its size rather than inheriting one', () => {
    // An implicit size is not wrong, but it makes the scale impossible to read off
    // the source — and it is how a heading ends up matching its body text.
    const offenders: string[] = [];
    for (const f of LEARNER_SURFACES) {
      const src = read(f);
      for (const m of src.matchAll(/<(h[1-3])\b([^>]*)>/g)) {
        const cls = /className="([^"]*)"/.exec(m[2])?.[1] ?? '';
        if (!/\btext-(base|lg|xl|2xl|3xl)\b/.test(cls)) {
          const line = src.slice(0, m.index ?? 0).split('\n').length;
          offenders.push(`${f}:${line} <${m[1]}> has no explicit size`);
        }
      }
    }
    expect(offenders, offenders.join('\n')).toEqual([]);
  });
});

describe('page rhythm is the same on every learner shell', () => {
  it('all use px-6 py-12 sm:py-14', () => {
    // Three had py-12 and one py-12 sm:py-14, which is the kind of difference
    // nobody notices individually and everybody feels moving between pages.
    const offenders: string[] = [];
    for (const f of PAGE_SHELLS) {
      const shell = /<main className="([^"]*)"/.exec(read(f))?.[1] ?? '(no main)';
      if (!/px-6 py-12 sm:py-14/.test(shell)) offenders.push(`${f} — "${shell}"`);
    }
    expect(offenders, offenders.join('\n')).toEqual([]);
  });

  it('container width follows the stated rule: grids wide, reading columns 3xl', () => {
    const width = (f: string) => /<main className="[^"]*max-w-(\w+)/.exec(read(f))?.[1] ?? null;
    // Storefront is a 3-card grid, the dashboard a 4-tile stat grid; the rest are
    // single reading/working columns. This was three arbitrary-looking widths until
    // the rule was written down in globals.css.
    expect(width('src/app/t/[slug]/page.tsx')).toBe('5xl');
    expect(width('src/app/t/[slug]/dashboard/page.tsx')).toBe('4xl');
    expect(width('src/app/t/[slug]/courses/[courseSlug]/page.tsx')).toBe('3xl');
    expect(width('src/app/t/[slug]/learn/[courseSlug]/page.tsx')).toBe('3xl');
  });

  it('the rule is documented where the tokens live', () => {
    expect(CSS).toContain('Learner-surface scale');
  });
});

describe('hover feedback fades rather than snaps', () => {
  it('every row with a hover background also transitions', () => {
    const offenders: string[] = [];
    for (const f of LEARNER_SURFACES) {
      const src = read(f);
      for (const m of src.matchAll(/className=(?:"|\{cn\(\s*')([^"']*hover:bg-[^"']*)/g)) {
        if (!/transition/.test(m[1])) {
          const line = src.slice(0, m.index ?? 0).split('\n').length;
          offenders.push(`${f}:${line} — "${m[1].slice(0, 60)}"`);
        }
      }
    }
    expect(offenders, offenders.join('\n')).toEqual([]);
  });
});
