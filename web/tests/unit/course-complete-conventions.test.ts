import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { token, ratio, NEUTRAL_700, AA_NORMAL_TEXT } from './helpers/contrast';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');

/**
 * Comments stripped. These guards are about what RENDERS, and the component's own
 * doc comment names the very words being banned in order to explain why — which
 * failed the first version of this test against a component that was correct.
 */
function code(src: string): string {
  return src.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
}

const PANEL = code(read('src/components/course-complete.tsx'));
const OUTLINE = read('src/app/t/[slug]/learn/[courseSlug]/page.tsx');

describe('finishing a course is acknowledged', () => {
  it('the outline shows the panel once the course is complete', () => {
    expect(OUTLINE).toContain('<CourseComplete');
    expect(OUTLINE).toMatch(/progress\.isComplete && view\.enrollmentId \?/);
  });

  it('a previewing admin is never shown a certificate', () => {
    // An admin previewing has no enrolment, so there is no certificate — telling
    // them they had earned one, and linking to /verify/null, would be a lie the
    // rest of the preview banner explicitly promises not to tell.
    const cond = /\{([^?]*)\?\s*\(\s*<div className="mt-4">\s*<CourseComplete/.exec(OUTLINE);
    expect(cond, 'could not find the panel condition').not.toBeNull();
    expect(cond?.[1] ?? '', 'gate the panel on enrollmentId, not on progress alone').toContain(
      'view.enrollmentId',
    );
  });

  it('surfaces the verification code, not just a link', () => {
    // The code is the point: a contractor showing a client needs something the
    // client can check without an account, and the only other copy is in an email.
    expect(PANEL).toContain('verificationCode');
    expect(PANEL).toMatch(/font-mono/);
    expect(PANEL).toMatch(/\/verify\/\$\{verificationCode\}/);
  });

  it('admits it when a certificate is missing rather than linking nowhere', () => {
    // Reachable if issuance failed after the enrolment was marked completed.
    expect(PANEL).toMatch(/verificationCode \?/);
    expect(PANEL).toMatch(/not been issued yet/);
  });

  it('does not fetch the certificate in a serial round trip', () => {
    // The page was deliberately parallelised earlier; a lone await here would put
    // the extra query back on the critical path.
    const block = OUTLINE.slice(OUTLINE.indexOf('const [progress, certificate]'));
    expect(block.slice(0, 400)).toContain('Promise.all');
  });
});

describe('the acknowledgement does not pre-empt the blocked wording decision', () => {
  // What the credential is CALLED is an open decision for the account owner
  // ("Outdure Certified — Trained" using the Connect tiers, vs a generic
  // "Certificate of Completion"). The certificate page derives its heading from
  // the tenant's template. Naming a designation here would quietly decide it, and
  // could contradict the certificate the learner then opens.
  it('claims no designation or tier', () => {
    const claims = ['Certified', 'Outdure Trained', 'now Trained', 'Verified Contractor'];
    const found = claims.filter((c) => PANEL.includes(c));
    expect(found, `remove designation wording until the owner decides: ${found.join(', ')}`).toEqual(
      [],
    );
  });
});

describe('body copy on the brand tint is readable (WCAG 2.1 AA, 1.4.3)', () => {
  it('muted grey would FAIL on this background — hence neutral-700', () => {
    // 4.38:1. It passes on white (4.63:1), which is exactly why reaching for the
    // usual `text-muted` here looks right and is not.
    const muted = ratio(token('--color-muted'), token('--color-brand-50'));
    expect(muted).toBeLessThan(AA_NORMAL_TEXT);
    expect(
      PANEL,
      `text-muted on --color-brand-50 is ${muted.toFixed(2)}:1 — below AA. Use text-neutral-700.`,
    ).not.toMatch(/text-muted/);
  });

  it('the colour actually used clears AA comfortably', () => {
    expect(PANEL).toMatch(/text-neutral-700/);
    expect(ratio(NEUTRAL_700, token('--color-brand-50'))).toBeGreaterThan(7);
  });

  it('the brand-700 accents clear AA too', () => {
    // Used for the icon and the "Verification code" label.
    expect(ratio(token('--color-brand-700'), token('--color-brand-50'))).toBeGreaterThanOrEqual(
      AA_NORMAL_TEXT,
    );
  });
});

describe('the panel is announced sensibly', () => {
  it('is a labelled region with a real heading', () => {
    expect(PANEL).toMatch(/aria-labelledby="course-complete-heading"/);
    expect(PANEL).toMatch(/id="course-complete-heading"/);
    expect(PANEL).toMatch(/<h2/);
  });

  it('decorative icons are hidden from screen readers', () => {
    const icons = [...PANEL.matchAll(/<(Award|ShieldCheck)\b[^/]*\/>/g)].map((m) => m[0]);
    expect(icons.length, 'expected the award and shield icons').toBe(2);
    // Award sits inside an aria-hidden wrapper; ShieldCheck carries its own.
    expect(PANEL).toMatch(/aria-hidden="true"[\s\S]{0,200}<Award/);
    expect(PANEL).toMatch(/<ShieldCheck aria-hidden="true"/);
  });
});
