import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';
import { token, ratio, AA_NORMAL_TEXT } from './helpers/contrast';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');
const code = (p: string) =>
  read(p)
    .replace(/\{\s*\/\*[\s\S]*?\*\/\s*\}/g, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

/**
 * Comment-stripped. Asserting against raw CSS let a guard pass because the block
 * comment ABOVE the declaration contained the string it searched for — the fourth
 * time in this backlog a source-reading guard has been satisfied by its own
 * documentation. Strip first, always.
 */
const CSS = read('src/app/globals.css').replace(/\/\*[\s\S]*?\*\//g, '');

/**
 * WCAG 2.1 AA. Every ratio below was computed in a browser against the real rendered
 * colours, using a canvas to resolve whatever syntax the value is written in — an
 * earlier version of that sweep parsed digits out of the string and silently mangled
 * every `oklch()` colour Tailwind emits, reporting a 1.03:1 failure that did not exist.
 */
describe('the skip link is visible when focused (2.4.7)', () => {
  /*
   * Tailwind v4 changed `.sr-only` from `clip: rect(0,0,0,0)` to
   * `clip-path: inset(50%)`. `.skip-link:focus` released only the old `clip`, so on
   * focus it became a correctly positioned 133x42 box with a white background, a
   * border and the brand focus outline — that painted absolutely nothing. Verified
   * before and after with a real keyboard Tab.
   */
  it('releases clip-path, not just the legacy clip property', () => {
    const block = CSS.slice(CSS.indexOf('.skip-link:focus'));
    const rule = block.slice(0, block.indexOf('}'));
    expect(rule, 'clip-path from .sr-only survives and clips the whole paint').toMatch(
      /clip-path:\s*none/,
    );
  });

  it('and still has something to skip to', () => {
    expect(code('src/components/admin-shell.tsx')).toMatch(/href="#main-content"/);
    expect(code('src/components/admin-shell.tsx')).toMatch(/id="main-content"/);
  });
});

describe('form field boundaries clear 3:1 (1.4.11)', () => {
  /*
   * --color-input is the ONLY thing marking a text field's extent: the field fill
   * (#f9fafb) is 1.05:1 against the white page, so it contributes no boundary. At
   * #e5e7eb the border was 1.24:1 — effectively invisible.
   */
  const AA_NON_TEXT = 3;

  it('the input border contrasts with the page', () => {
    const r = ratio(token('--color-input'), token('--color-surface'));
    expect(r, `--color-input on white is ${r.toFixed(2)}:1, needs 3:1`).toBeGreaterThanOrEqual(
      AA_NON_TEXT,
    );
  });

  it('and with the field fill on its other side', () => {
    // A boundary has two neighbours. #949494 passes against white (3.03) and FAILS
    // against the fill (2.90), which is why it was not the value chosen.
    const r = ratio(token('--color-input'), token('--color-input-background'));
    expect(
      r,
      `--color-input on the field fill is ${r.toFixed(2)}:1, needs 3:1`,
    ).toBeGreaterThanOrEqual(AA_NON_TEXT);
  });

  it('--color-border stays light, because it is decoration not a control boundary', () => {
    // Card edges and dividers are exempt: 1.4.11 covers what identifies a component.
    expect(ratio(token('--color-border'), token('--color-surface'))).toBeLessThan(AA_NON_TEXT);
  });
});

describe('every heading level is chosen deliberately (1.3.1)', () => {
  /*
   * CardTitle hardcoded <h4>. On login, forgot-password, set-password and
   * auth-code-error the card title IS the page title, so those four pages had no <h1>
   * at all and their outline began at level 4; the storefront skipped h1 -> h4.
   * Measured in a browser: /login reported h1Count: 0.
   */
  it('CardTitle makes the compiler ask for a level', () => {
    const src = code('src/components/ui/card.tsx');
    expect(src, 'an optional prop would let the next call site repeat the bug').toMatch(
      /as:\s*['\"]h1['\"]\s*\|\s*['\"]h2['\"]/,
    );
    expect(src, 'no hardcoded heading element').not.toMatch(/<h4\b/);
  });

  it('every CardTitle passes one', () => {
    const SRC = join(process.cwd(), 'src');
    const walk = (dir: string): string[] => {
      const out: string[] = [];
      for (const e of readdirSync(dir)) {
        const f = join(dir, e);
        if (statSync(f).isDirectory()) out.push(...walk(f));
        else if (f.endsWith('.tsx')) out.push(f);
      }
      return out;
    };
    const offenders: string[] = [];
    for (const f of walk(SRC)) {
      if (f.endsWith(join('ui', 'card.tsx'))) continue;
      const src = readFileSync(f, 'utf8');
      for (const m of src.matchAll(/<CardTitle\b([^>]*)>/g)) {
        if (!/\bas=/.test(m[1])) {
          offenders.push(`${relative(SRC, f).replace(/\\/g, '/')} — <CardTitle> with no as=`);
        }
      }
    }
    expect(offenders, offenders.join('\n')).toEqual([]);
  });

  it('the four auth pages use h1, since the card title is the page title', () => {
    for (const f of [
      'src/app/login/page.tsx',
      'src/app/login/forgot/page.tsx',
      'src/app/auth/set-password/page.tsx',
      'src/app/auth/auth-code-error/page.tsx',
    ]) {
      expect(code(f), `${f} needs an h1`).toMatch(/<CardTitle as="h1"/);
    }
  });
});

describe('async outcomes are announced (4.1.3)', () => {
  it('the signup error is in a live region with role=alert', () => {
    // It was inserted as a bare <p>, so a failed signup ("The subdomain is taken.")
    // was completely silent. The form stays mounted, so it is a status message.
    const src = code('src/app/signup/page.tsx');
    expect(src).toMatch(/aria-live="polite"/);
    expect(src).toMatch(/role="alert"/);
  });

  it('every page that renders an inline error announces it', () => {
    const PAGES = [
      'src/app/signup/page.tsx',
      'src/app/login/page.tsx',
      'src/app/t/[slug]/admin/people/invite-form.tsx',
    ];
    for (const f of PAGES) {
      const src = code(f);
      if (!/\{error &&/.test(src)) continue;
      expect(src, `${f} shows an error with no role=alert`).toMatch(/role="alert"/);
    }
  });
});

describe('controls have names, and the names match what is visible', () => {
  it('the video file input has a real label (4.1.2)', () => {
    // type=file has no placeholder fallback, so its accessible name was the empty
    // string — the one control in the app with literally no name.
    const src = code('src/components/video-upload.tsx');
    expect(src).toMatch(/<label htmlFor=\{`\$\{uid\}-file`\}/);
    expect(src).toMatch(/id=\{`\$\{uid\}-file`\}/);
    expect(src, 'one VideoUpload renders per video lesson, so the id must be unique').toMatch(
      /useId/,
    );
  });

  it('signup fields declare their purpose (1.3.5)', () => {
    const src = code('src/app/signup/page.tsx');
    for (const t of ['name', 'email', 'new-password', 'organization']) {
      expect(src, `missing autoComplete="${t}"`).toContain(`autoComplete="${t}"`);
    }
  });

  it('no aria-label overrides a visible wrapping label (2.5.3)', () => {
    /*
     * Two controls in the quiz builder had an aria-label AND a wrapping <label>. The
     * aria-label wins, so the accessible name no longer contained the visible text —
     * a voice-control user saying "Correct option" could not activate the field. They
     * were added to satisfy an earlier guard that only recognised aria-label; that
     * guard now accepts a wrapping label too.
     */
    const src = code('src/app/t/[slug]/admin/courses/[courseId]/builder/quiz/[lessonId]/page.tsx');
    const offenders: string[] = [];
    for (const m of src.matchAll(/<(Input|select|textarea)\b([\s\S]{0,300}?)\/?>/g)) {
      if (!/aria-label=/.test(m[2])) continue;
      const before = src.slice(0, m.index ?? 0);
      if (before.lastIndexOf('<label') > before.lastIndexOf('</label>')) {
        offenders.push(`line ${before.split('\n').length} <${m[1]}> is inside a <label>`);
      }
    }
    expect(
      offenders,
      `drop the aria-label; the wrapping label already names it:\n${offenders.join('\n')}`,
    ).toEqual([]);
  });
});

describe('text contrast (1.4.3)', () => {
  it('amber-600 is not used for body text on white', () => {
    // #e17100 on #ffffff is 3.20:1. amber-700 (#bb4d00) is 5.03:1 and is already the
    // app's amber-on-white choice elsewhere.
    const SRC = join(process.cwd(), 'src');
    const walk = (dir: string): string[] => {
      const out: string[] = [];
      for (const e of readdirSync(dir)) {
        const f = join(dir, e);
        if (statSync(f).isDirectory()) out.push(...walk(f));
        else if (/\.tsx?$/.test(f)) out.push(f);
      }
      return out;
    };
    const offenders = walk(SRC)
      .filter((f) => /\btext-amber-600\b/.test(readFileSync(f, 'utf8')))
      .map((f) => relative(SRC, f).replace(/\\/g, '/'));
    expect(offenders, `text-amber-600 is 3.20:1 on white:\n${offenders.join('\n')}`).toEqual([]);
  });

  it('a destructive text button stays red AND readable while hovered', () => {
    // #dc2626 on the ghost hover fill #f1f5f9 is 4.41:1 — just under. The audit's fix
    // was to surrender the red; darkening it instead keeps the cue at 5.91:1.
    const src = code('src/app/platform/page.tsx');
    expect(src).toMatch(/text-destructive hover:text-red-700/);
  });

  it('the muted token still clears AA on both surfaces it is used on', () => {
    expect(ratio(token('--color-muted'), token('--color-surface'))).toBeGreaterThanOrEqual(
      AA_NORMAL_TEXT,
    );
    expect(ratio(token('--color-muted'), token('--color-surface-muted'))).toBeGreaterThanOrEqual(
      AA_NORMAL_TEXT,
    );
  });
});

describe('the app does not ship half a dark theme', () => {
  /*
   * globals.css defines no dark tokens and there is no toggle, but the UI kit ships
   * seven `dark:` variants. In Tailwind v4 `dark:` defaults to
   * @media (prefers-color-scheme: dark), so on a dark-preferring machine — most phones
   * — `dark:bg-input/30` painted a translucent mid-grey fill inside every field on an
   * otherwise entirely light page. Measured: prefersDark true, field background
   * oklab(...  / 0.3) before, rgb(249,250,251) after.
   */
  it('dark: is class-based, so it cannot fire from an OS preference', () => {
    expect(CSS).toMatch(/@custom-variant dark \(&:where\(\.dark, \.dark \*\)\)/);
  });

  it('and the browser is told the palette is light', () => {
    expect(CSS).toMatch(/color-scheme:\s*light/);
  });
});
