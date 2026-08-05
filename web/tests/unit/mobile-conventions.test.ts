import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const code = (p: string) =>
  read(p)
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

/**
 * Contractors use this on a phone, on site, sometimes in gloves. The backlog's bar is
 * a 44px tap target — stricter than WCAG 2.2 AA's 24px (2.5.8), deliberately.
 *
 * Everything here was measured in a browser at 375px, not derived from the classes.
 */
describe('the primitives are 44px on a phone and unchanged on a desktop', () => {
  /*
   * Input was h-9 (36px) and Button default h-10 (40px) at every width — the two
   * commonest controls in the app, both under the bar. Fixed mobile-first
   * (`h-11 sm:h-9`) so a phone gets 44px and desktop density is untouched: measured
   * 44px at 375px and 36/40px at 1280px.
   */
  it('Input is 44px below sm', () => {
    const src = code('src/components/ui/input.tsx');
    expect(src).toMatch(/\bh-11\b/);
    expect(src, 'desktop density must be preserved explicitly').toMatch(/\bsm:h-9\b/);
  });

  it('Button default, sm and icon each clear 44px below sm', () => {
    const src = code('src/components/ui/button.tsx');
    expect(src).toMatch(/default: ['\"]h-11 [^'\"]*sm:h-10['\"]/);
    expect(src).toMatch(/sm: ['\"]h-10 [^'\"]*sm:h-9['\"]/);
    expect(src).toMatch(/icon: ['\"]h-11 w-11 sm:h-10 sm:w-10['\"]/);
  });
});

describe('text links that act as controls have a real hit area', () => {
  /*
   * Nine back-links shared one hand-written class string and measured 20px — under
   * even the WCAG floor. They are now one component, and it uses `py-3` with
   * `-my-1.5` so the target is 44px while the page rhythm is unchanged.
   */
  it('BackLink is 44px and gives half its padding back to the layout', () => {
    const src = code('src/components/back-link.tsx');
    expect(src).toMatch(/py-3/);
    expect(src, 'without the negative inset a bigger target pushes the heading down').toMatch(
      /-my-1\.5/,
    );
  });

  it('nothing re-introduces the bare 20px back-link string', () => {
    // The exact class string that was duplicated nine times.
    const OLD = 'inline-flex items-center gap-1.5 text-sm text-muted hover:underline';
    const offenders: string[] = [];
    for (const f of [
      'src/app/t/[slug]/courses/[courseSlug]/page.tsx',
      'src/app/t/[slug]/learn/[courseSlug]/page.tsx',
      'src/app/t/[slug]/learn/[courseSlug]/[lessonId]/page.tsx',
      'src/app/t/[slug]/admin/courses/new/page.tsx',
      'src/app/t/[slug]/admin/courses/[courseId]/page.tsx',
      'src/app/t/[slug]/admin/courses/[courseId]/builder/page.tsx',
      'src/app/t/[slug]/admin/courses/[courseId]/builder/quiz/[lessonId]/page.tsx',
    ]) {
      if (code(f).includes(OLD)) offenders.push(f);
    }
    expect(offenders, `use <BackLink>:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('the three other bare-text controls carry padding or a min-height', () => {
    // Each measured 20px (16px for the login one) and each is a real destination:
    // the PDF opener on a PDF lesson, the certificate link on the dashboard, and
    // password recovery on a shared site machine.
    const cases: [string, RegExp][] = [
      [
        'src/app/t/[slug]/learn/[courseSlug]/[lessonId]/page.tsx',
        /min-h-11[^"]*text-sm text-brand-700/,
      ],
      ['src/app/t/[slug]/dashboard/page.tsx', /py-3 text-sm text-brand-700/],
      ['src/app/login/page.tsx', /min-h-11[^"]*text-xs text-muted underline/],
    ];
    for (const [f, re] of cases) {
      expect(code(f), `${f} has a bare-text control again`).toMatch(re);
    }
  });
});

describe('the most-tapped learner control clears the bar', () => {
  it('a quiz answer row is 44px+', () => {
    // Measured 38px: the label wraps the input, so the row IS the target, and it was
    // 6px short on the highest-frequency deliberate tap in the product.
    const src = code('src/components/quiz-form.tsx');
    expect(src).toMatch(/rounded-md border border-border px-3 py-3 text-sm/);
  });
});

describe('the lesson list survives on a phone', () => {
  /*
   * The player's sidebar is `hidden lg:block` and the mobile substitute was a back
   * link and a progress bar — so at 375px the course structure was simply absent. No
   * lesson list, no sense of position, no way to jump; the only route was prev/next
   * or backing out to the outline page.
   */
  const PLAYER = code('src/app/t/[slug]/learn/[courseSlug]/[lessonId]/page.tsx');

  it('the player renders a lesson list in the mobile block', () => {
    const mobile = PLAYER.slice(PLAYER.indexOf('lg:hidden'));
    expect(mobile.slice(0, 1400), 'no LessonNav below lg').toContain('<LessonNav');
  });

  it('it is a disclosure, so the video still leads', () => {
    expect(PLAYER).toMatch(/<details/);
    expect(PLAYER).toMatch(/<summary/);
  });

  it('desktop and mobile share one implementation', () => {
    // Two copies of a lesson list would drift; the aside and the disclosure both
    // render the component.
    expect((PLAYER.match(/<LessonNav/g) ?? []).length).toBe(2);
  });

  it('rows are 44px on a phone and keep the sidebar tighter', () => {
    const nav = code('src/components/lesson-nav.tsx');
    expect(nav).toMatch(/py-3[^']*lg:py-1\.5/);
  });

  it('completion is not conveyed by icon alone', () => {
    const nav = code('src/components/lesson-nav.tsx');
    expect(nav).toMatch(/sr-only">\(completed\)/);
  });
});

describe('a printed certificate is verifiable', () => {
  /*
   * The verification code sat OUTSIDE the <article> carrying `print:hidden`, and
   * there is no @media print block anywhere to put it back — so printing, or "Save
   * as PDF" on a phone, produced a certificate with no code and no verify URL on it.
   * That is the one thing the page exists to provide, and Save-as-PDF is exactly how
   * a contractor keeps a copy to show a client.
   */
  const src = code('src/app/verify/[code]/page.tsx');

  it('the code is inside the certificate article', () => {
    const article = src.slice(src.indexOf('<article'), src.indexOf('</article>'));
    expect(article, 'the code must not be separable from the certificate').toContain('{code}');
  });

  it('and is not hidden from print', () => {
    const article = src.slice(src.indexOf('<article'), src.indexOf('</article>'));
    const codeLine = article.slice(
      Math.max(0, article.indexOf('{code}') - 300),
      article.indexOf('{code}'),
    );
    expect(codeLine, 'print:hidden on the code defeats the whole page').not.toContain(
      'print:hidden',
    );
  });

  it('tells the reader where to check it', () => {
    expect(src).toMatch(/Verify at \{verifyHost\}/);
  });

  it('does not use absoluteUrl, which throws rather than degrading', () => {
    // absoluteUrl refuses to build a loopback URL in production — correct for an
    // email link, but on a page render it would 500 the certificate instead of
    // printing one line less usefully.
    //
    // Comment-stripped: the page's own comment names absoluteUrl to explain why it
    // is NOT used, and matching that is the third time in this backlog a guard has
    // failed against correct code by reading its own documentation.
    expect(code('src/app/verify/[code]/page.tsx')).not.toMatch(/absoluteUrl\(/);
  });

  it('still hides the print button from its own output', () => {
    expect(code('src/components/print-button.tsx')).toContain('print:hidden');
  });
});
