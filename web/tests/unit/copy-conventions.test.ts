import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

const SRC = join(process.cwd(), 'src');
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
const rel = (f: string) => relative(SRC, f).replace(/\\/g, '/');

describe('error messages survive the NavForm filter', () => {
  /*
   * The trap that makes a longer, kinder error WORSE than a short blunt one.
   *
   * nav-form.tsx's friendly() passes a thrown message through only if it is UNDER 120
   * characters; anything longer is replaced wholesale with "Something went wrong.
   * Please reload and try again." So rewriting "Course not available" into a helpful
   * two-sentence explanation can silently delete it. Two of this pass's proposed
   * replacements were over the limit and had to be shortened before they could ship.
   */
  const LIMIT = 120;

  it('friendly() still has the limit these are written against', () => {
    const nav = code('src/components/nav-form.tsx');
    expect(nav, 'if this number moves, every message below needs re-checking').toMatch(
      /message\.length < 120/,
    );
  });

  /*
   * The blind spot that let a 143-character message ship.
   *
   * The check below only matches a single-quoted literal, so a message built by
   * concatenation or a template literal was never measured. The publish guard's
   * explanation of why an empty quiz cannot be published was 143 characters —
   * friendly() replaced the whole thing with "Something went wrong. Please reload
   * and try again.", so the admin was told nothing at all, and no test noticed.
   */
  it('no thrown message exceeds it once template holes are filled', () => {
    /*
     * Exempt: diagnostics thrown for a developer, which never travel through a
     * Server Action into friendly(). absolute-url.ts throws at boot on a
     * misconfigured NEXT_PUBLIC_ROOT_DOMAIN, and email.ts reports what Resend
     * rejected — the invite path catches that one and substitutes its own
     * admin-facing warning.
     */
    const DIAGNOSTIC = ['lib/absolute-url.ts', 'lib/email.ts'];
    // A template hole's realistic width depends on what goes in it. A course or
    // lesson title is the case that made a message overflow, so those get 45
    // characters (nameFirst truncates to 40); an option number or count is one or
    // two digits, and substituting 45 for those measured lib/quiz.ts at 131 when
    // "There is no option 4 — this question has 3." is 43.
    const fill = (expr: string) => (/title|name/i.test(expr) ? 'x'.repeat(45) : '99');
    const offenders: string[] = [];
    for (const f of FILES.filter(
      (f) => f.endsWith('actions.ts') || /src[\\/]lib[\\/].*\.ts$/.test(f),
    )) {
      if (DIAGNOSTIC.some((d) => rel(f).endsWith(d))) continue;
      const src = code(f);
      for (const m of src.matchAll(/throw new Error\(([\s\S]{0,600}?)\);/g)) {
        const parts = [...m[1].matchAll(/'([^']*)'|`([^`]*)`/g)].map((p) => p[1] ?? p[2] ?? '');
        const text = parts
          .join('')
          .replace(/\$\{([^}]*)\}/g, (_, expr) => fill(expr))
          .replace(/\s+/g, ' ')
          .trim();
        if (!text || /^[A-Z_]+$/.test(text)) continue;
        if (text.length >= LIMIT) {
          offenders.push(`${rel(f)} — ${text.length} chars: "${text.slice(0, 60)}…"`);
        }
      }
    }
    expect(
      offenders,
      `friendly() replaces these with a generic apology, so the detail never lands:\n${offenders.join('\n')}`,
    ).toEqual([]);
  });

  it('no thrown error string in a Server Action exceeds it', () => {
    const offenders: string[] = [];
    // src/lib too, not just actions.ts: parseCorrectIndices throws the answer-key
    // messages from lib/quiz.ts, and naming the offending option number is the
    // whole point — friendly() replacing it with a generic apology would undo
    // that. Measured: all 8 pre-existing throw-strings in src/lib already fit.
    for (const f of FILES.filter(
      (f) => f.endsWith('actions.ts') || /src[\\/]lib[\\/].*\.ts$/.test(f),
    )) {
      const src = code(f);
      for (const m of src.matchAll(/throw new Error\(\s*'([^']{6,})'/g)) {
        const text = m[1];
        if (/^[A-Z_]+$/.test(text)) continue; // sentinels like FORBIDDEN are mapped
        if (text.length >= LIMIT) {
          offenders.push(`${rel(f)} — ${text.length} chars: "${text.slice(0, 60)}…"`);
        }
      }
    }
    expect(
      offenders,
      `friendly() swallows these and shows "Something went wrong" instead:\n${offenders.join('\n')}`,
    ).toEqual([]);
  });
});

describe('internal vocabulary does not reach the screen', () => {
  /*
   * The glossary is explicit: "academy" is the user-facing word for a tenant,
   * "learner" for an end user. Three thrown strings said "tenant" outright and reached
   * the user verbatim, because friendly()'s sentinel checks are CASE-SENSITIVE —
   * 'Forbidden' never matched its 'FORBIDDEN' branch.
   */
  it('no user-visible string says "tenant"', () => {
    const offenders: string[] = [];
    for (const f of FILES) {
      const src = code(f);
      // quoted strings that are rendered or thrown, not identifiers or imports
      for (const m of src.matchAll(/(?:throw new Error\(|error:\s*|>)\s*'([^']*\btenant\b[^']*)'/gi)) {
        offenders.push(`${rel(f)} — "${m[1].slice(0, 60)}"`);
      }
    }
    expect(offenders, `say "academy":\n${offenders.join('\n')}`).toEqual([]);
  });

  it('the platform guard throws the sentinel friendly() actually matches', () => {
    // It threw 'Forbidden'; includes('FORBIDDEN') is case-sensitive, so the raw word
    // was shown instead of "You don't have permission to do that."
    expect(code('src/app/platform/actions.ts')).toMatch(/throw new Error\('FORBIDDEN'\)/);
  });

  it('"ingest" and "provider" stay out of the interface', () => {
    const offenders: string[] = [];
    for (const f of FILES) {
      const src = code(f);
      for (const m of src.matchAll(/>\s*([^<>{]*\b(?:ingest|Ingest)\w*\b[^<>{]*)</g)) {
        offenders.push(`${rel(f)} — "${m[1].trim().slice(0, 50)}"`);
      }
      for (const m of src.matchAll(/(?:throw new Error\(|error:\s*)'([^']*\bprovider\b[^']*)'/g)) {
        offenders.push(`${rel(f)} — "${m[1].slice(0, 50)}"`);
      }
    }
    expect(offenders, offenders.join('\n')).toEqual([]);
  });

  it('no raw Stripe status reaches the billing page', () => {
    // `capitalize` does not split an underscore, so past_due rendered as "Past_due".
    const src = code('src/app/t/[slug]/admin/settings/billing/page.tsx');
    expect(src).toMatch(/SUBSCRIPTION_STATUS\[sub\.status\]/);
    expect(src, 'capitalize on a raw enum is what caused this').not.toMatch(
      /capitalize">Status: \{sub\.status\}/,
    );
  });

  it('the provider is not quoted verbatim at sign-in', () => {
    // Supabase's "Invalid login credentials" is accurate, anonymous and useless.
    const src = code('src/app/login/page.tsx');
    expect(src).toMatch(/signInMessage\(error\.message\)/);
    expect(src).not.toMatch(/setError\(error\.message\)/);
  });
});

describe('British English, consistently', () => {
  // The product is British throughout — "enrolment", "colour", "centre", "programme".
  // The DATABASE spells it `enrollments`, and that is fine; the screen must not.
  const AMERICANISMS: [RegExp, string][] = [
    [/\bEnroll\b/g, 'Enrol'],
    [/\bEnrollments\b/g, 'Enrolments'],
    [/\bAccent color\b/g, 'Accent colour'],
    [/\bReview Center\b/g, 'Review Centre'],
    [/\bAffiliate Program\b/g, 'Affiliate Programme'],
  ];

  it('no user-visible string uses an American spelling', () => {
    const offenders: string[] = [];
    for (const f of FILES) {
      const src = code(f);
      for (const [re, better] of AMERICANISMS) {
        for (const m of src.matchAll(re)) {
          // skip identifiers: enrollFree, enrollments.table, enrollmentId
          const after = src.slice((m.index ?? 0) + m[0].length, (m.index ?? 0) + m[0].length + 2);
          if (/^[A-Za-z(.]/.test(after)) continue;
          offenders.push(`${rel(f)} — "${m[0]}" should be "${better}"`);
        }
      }
    }
    expect(offenders, offenders.join('\n')).toEqual([]);
  });

  it('"School" is not used for an academy', () => {
    // LearnWorlds vocabulary. The settings page said "School Settings" directly above
    // a subtitle reading "Your academy's name…" and a field labelled "Academy name".
    const offenders = FILES.filter((f) => /\bSchool\b/.test(code(f))).map(rel);
    expect(offenders, `use "Academy":\n${offenders.join('\n')}`).toEqual([]);
  });
});

describe('destructive confirmations name the consequence', () => {
  it('every confirm says more than what is being deleted', () => {
    // "Delete this question?" named the object and stopped. A confirmation should let
    // the reader predict what they lose.
    const offenders: string[] = [];
    for (const f of FILES) {
      for (const m of code(f).matchAll(/confirm="([^"]+)"/g)) {
        const text = m[1];
        const sentences = text.split(/[.?]\s+/).filter(Boolean).length;
        if (sentences < 2) offenders.push(`${rel(f)} — "${text}"`);
      }
    }
    expect(
      offenders,
      `add what happens, and whether it can be undone:\n${offenders.join('\n')}`,
    ).toEqual([]);
  });

  it('none of them asks "Are you sure?"', () => {
    const offenders: string[] = [];
    for (const f of FILES) {
      for (const m of code(f).matchAll(/confirm="([^"]+)"/g)) {
        if (/are you sure/i.test(m[1])) offenders.push(`${rel(f)} — "${m[1]}"`);
      }
    }
    expect(offenders, offenders.join('\n')).toEqual([]);
  });
});

describe('the voice holds', () => {
  it('no exclamation marks in user-visible copy', () => {
    // "Passed!" was the only one. The product does not shout.
    const offenders: string[] = [];
    for (const f of FILES) {
      const src = code(f);
      for (const m of src.matchAll(/'([^']*!)'|>([^<>{]*!)</g)) {
        const text = (m[1] ?? m[2] ?? '').trim();
        if (!text || /!=|!==|!\w/.test(text)) continue;
        offenders.push(`${rel(f)} — "${text.slice(0, 50)}"`);
      }
    }
    expect(offenders, offenders.join('\n')).toEqual([]);
  });

  it('nobody is told to "contact support" when there is no support to contact', () => {
    // grep found no support address, mailto or contact route anywhere in the product.
    const hasSupportRoute =
      FILES.some((f) => /mailto:|\/support\b/.test(read(f)));
    const tellsThem = FILES.filter((f) => /contact support/i.test(code(f))).map(rel);
    if (!hasSupportRoute) {
      expect(tellsThem, `there is no support channel to send them to:\n${tellsThem.join('\n')}`)
        .toEqual([]);
    }
  });
});
