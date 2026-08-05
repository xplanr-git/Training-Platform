import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');

/**
 * Comments stripped, including JSX `{/* … *␍/}` blocks. These guards are about what
 * renders, and a comment explaining what was removed names the very markup being
 * banned — which failed the first version of this suite against correct code, for
 * the second time in this backlog.
 */
const code = (p: string) =>
  read(p)
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

/** The four admin tables. They should be recognisably one component family. */
const TABLES = [
  'src/app/t/[slug]/admin/courses/page.tsx',
  'src/app/t/[slug]/admin/people/page.tsx',
  'src/app/t/[slug]/admin/certificates/page.tsx',
  'src/app/platform/page.tsx',
];

describe('all four admin tables are the same component family', () => {
  it('each uses the Table primitive rather than raw table markup', () => {
    // platform/page.tsx hand-rolled <table>/<thead>/<td>, so it disagreed with the
    // other three on row height, header treatment, hover and border colour.
    const offenders = TABLES.filter((f) => {
      const src = code(f);
      return !/from '@\/components\/ui\/table'/.test(src) || /<t(head|body|able)\b/.test(src);
    });
    expect(offenders, `use the Table primitive:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('each table sits on a white fill', () => {
    /*
     * This is what makes the row hover visible at all. The admin shell root is
     * `bg-surface-muted` (admin-shell.tsx), so a table with no fill of its own IS
     * that grey — and the row hover is also `bg-surface-muted`, so hovering changed
     * nothing. Three of the four had no fill.
     */
    const offenders = TABLES.filter((f) => {
      const wrapper = /<div className="([^"]*overflow-x-auto[^"]*)"/.exec(read(f))?.[1] ?? '';
      return !/\bbg-surface\b/.test(wrapper);
    });
    expect(
      offenders,
      `add bg-surface, or the hover is grey-on-grey:\n${offenders.join('\n')}`,
    ).toEqual([]);
  });

  it('the admin shell is still the grey that makes that necessary', () => {
    // If the shell ever goes white, the reasoning above changes and this should be
    // revisited rather than silently kept.
    // Pin the BACKGROUND only. This originally matched the whole class string
    // `flex min-h-screen bg-surface-muted`, which made it fail when the shell's
    // HEIGHT changed — a property it has no opinion about. An over-specified guard
    // fails on unrelated work, and the tempting fix is to delete it.
    const root = /<div className="([^"]*bg-surface-muted[^"]*)">/.exec(
      read('src/components/admin-shell.tsx'),
    );
    expect(
      root,
      'the shell root is no longer grey, so the tables may not need a fill',
    ).not.toBeNull();
  });

  it('status columns use Badge, not a bespoke pill', () => {
    // platform built its own from five off-token colour families (green-50, blue-50,
    // amber-50, red-50, neutral-100) — a sixth visual language for a solved problem.
    for (const f of TABLES) {
      const src = read(f);
      if (!/status/i.test(src)) continue;
      expect(src, `${f} should use Badge for status`).toMatch(/from '@\/components\/ui\/badge'/);
    }
    expect(
      read('src/app/platform/page.tsx'),
      'the bespoke STATUS_STYLES pill map should be gone',
    ).not.toMatch(/bg-green-50|bg-blue-50|bg-neutral-100/);
  });

  it('numeric columns are right-aligned and tabular', () => {
    // The member count was the only true numeric column in the four tables and it
    // was left-aligned in a proportional font.
    const src = read('src/app/platform/page.tsx');
    expect(src).toMatch(/text-right tabular-nums/);
  });

  it('row actions are right-aligned everywhere', () => {
    for (const f of TABLES) {
      const src = read(f);
      if (!/Actions/.test(src)) continue;
      expect(src, `${f}: the Actions header should be text-right`).toMatch(
        /<TableHead className="text-right">\s*Actions/,
      );
    }
  });
});

describe('admin forms use the primitives, not hand-rolled controls', () => {
  const FORMS = [
    'src/app/t/[slug]/admin/certificates/template/page.tsx',
    'src/app/t/[slug]/admin/courses/new/page.tsx',
    'src/app/t/[slug]/admin/people/invite-form.tsx',
  ];

  it('no raw <input> or hand-rolled submit <button> survives', () => {
    const offenders: string[] = [];
    for (const f of FORMS) {
      const src = read(f);
      for (const m of src.matchAll(/<input\b(?![^>]*type="hidden")/g)) {
        offenders.push(`${f}:${src.slice(0, m.index ?? 0).split('\n').length} raw <input>`);
      }
      for (const m of src.matchAll(/<button\b[^>]*type="submit"/g)) {
        offenders.push(`${f}:${src.slice(0, m.index ?? 0).split('\n').length} raw submit <button>`);
      }
    }
    expect(offenders, `use Input / Button:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('the invite form announces its outcome', () => {
    // It is the one admin form NOT routed through NavForm, so it does not inherit
    // NavForm's live region — and nothing else on the page changes on success.
    const src = read('src/app/t/[slug]/admin/people/invite-form.tsx');
    expect(src).toMatch(/aria-live="polite"/);
    expect(src, 'the error should be an alert, as NavForm makes it').toMatch(/role="alert"/);
  });
});

describe('state is never conveyed by colour alone (WCAG 1.4.1)', () => {
  it('a correct quiz option says so in words', () => {
    // It was a lucide Check plus brand-700 text. A screen reader got neither the
    // icon nor the colour, and colour alone fails 1.4.1 regardless.
    const src = read('src/app/t/[slug]/admin/courses/[courseId]/builder/quiz/[lessonId]/page.tsx');
    expect(src).toMatch(/\(correct\)/);
    expect(src, 'the tick is decorative once the word is there').toMatch(
      /<Check aria-hidden="true"/,
    );
  });

  it('a destructive button keeps its colour while hovered', () => {
    // Button's ghost variant sets hover:text-accent-foreground (#171717), which beat
    // the text-destructive className — so delete buttons turned near-black exactly
    // when the pointer was on them.
    for (const f of [
      'src/app/t/[slug]/admin/courses/[courseId]/builder/page.tsx',
      'src/app/t/[slug]/admin/courses/[courseId]/builder/quiz/[lessonId]/page.tsx',
    ]) {
      const src = read(f);
      for (const m of src.matchAll(/className="text-destructive([^"]*)"/g)) {
        expect(m[1], `${f}: text-destructive needs hover:text-destructive beside it`).toContain(
          'hover:text-destructive',
        );
      }
    }
  });
});

describe('a mobile admin can sign out', () => {
  it('the drawer carries the same footer as the desktop aside', () => {
    // The email + sign-out footer existed only in the desktop aside, and the drawer
    // is the only navigation a phone gets — so there was no way out at all.
    const src = read('src/components/admin-shell.tsx');
    const drawer = src.slice(src.indexOf('<SheetContent'), src.indexOf('</SheetContent>'));
    expect(drawer, 'no SignOutButton in the mobile drawer').toContain('SignOutButton');
  });

  it('and the button is big enough to hit on a phone', () => {
    // Measured at 20x86 before padding — under WCAG 2.2's 24px minimum (2.5.8), and
    // it matters most exactly where it is smallest: the drawer, on a phone, on site.
    const src = read('src/components/sign-out-button.tsx');
    expect(src, 'text alone gives a ~20px tall target').toMatch(/py-\d/);
  });
});

describe('the coming-soon route has a top-level heading', () => {
  it('FeatureGate renders an h1, since it is the whole page', () => {
    const src = read('src/components/feature-gate.tsx');
    expect(src).toMatch(/<h1/);
    expect(src, 'an h2 here left the route with no h1 at all').not.toMatch(/<h2/);
  });
});
