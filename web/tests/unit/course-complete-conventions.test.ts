import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { token, ratio, AA_NORMAL_TEXT } from './helpers/contrast';

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
    // Set in the system face with tabular figures, NOT font-mono: the design system
    // rejects monospace for codes, and the /verify page this mirrors already renders
    // the same code in sans + tabular.
    expect(PANEL).toContain('verificationCode');
    expect(PANEL).toMatch(/tabular-nums/);
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
    expect(
      found,
      `remove designation wording until the owner decides: ${found.join(', ')}`,
    ).toEqual([]);
  });
});

describe('body copy on the panel fill is readable (WCAG 2.1 AA, 1.4.3)', () => {
  /*
   * REWRITTEN, and worth saying why rather than just editing the numbers.
   *
   * This block used to assert "muted grey FAILS on this background — hence
   * neutral-700", measured against --color-brand-50, the pale-blue tint the panel
   * sat on. Under sb-ui the panel is sunken grey (#f1f1f0) and that premise is
   * simply no longer true: muted measures 4.70:1 there and passes. Left alone the
   * suite went red; "fixed" by flipping the comparison it would have asserted a
   * fact about a colour the component no longer uses.
   *
   * What survives the palette change is the actual lesson: body copy must be
   * measured against the panel's OWN fill, not against the page. So the fill is
   * read from the component, and every colour on it is checked against that.
   */
  const FILL = token('--color-sunken');

  it('the panel is filled with the sunken token, not a brand tint', () => {
    expect(PANEL, 'the fill these ratios are computed against').toMatch(/bg-sunken/);
    expect(PANEL, 'brand-* is the retired blue ramp').not.toMatch(/bg-brand-|border-brand-/);
  });

  it('body copy clears AA on that fill', () => {
    expect(PANEL).toMatch(/text-foreground-2/);
    expect(ratio(token('--color-foreground-2'), FILL)).toBeGreaterThan(7);
  });

  it('muted grey is still the wrong reach here, even though it now scrapes a pass', () => {
    // 4.70:1 — over the line by 0.2. That is a margin narrow enough that any future
    // darkening of the sunken fill silently drops it under, which is the argument
    // for --text-2 rather than a re-run of the same near-miss.
    const muted = ratio(token('--color-muted'), FILL);
    expect(muted).toBeLessThan(5);
    expect(PANEL, `text-muted on the sunken fill is only ${muted.toFixed(2)}:1`).not.toMatch(
      /text-muted/,
    );
  });

  it('the ink accents clear AA on it too', () => {
    // The medallion and the "Verification code" label.
    expect(ratio(token('--color-foreground'), FILL)).toBeGreaterThanOrEqual(AA_NORMAL_TEXT);
    // The medallion is ink-filled, so its glyph is on ink, not on the panel.
    expect(ratio(token('--color-primary-foreground'), token('--color-primary'))).toBeGreaterThan(7);
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
