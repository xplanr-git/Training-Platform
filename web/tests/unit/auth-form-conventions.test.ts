import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const SRC = resolve(process.cwd(), 'src');
/** Comments stripped — every one of these assertions is about code, and this
 *  repo has been fooled by its own prose six times. */
const code = (...p: string[]) =>
  readFileSync(join(SRC, ...p), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '')
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, '');

/**
 * The three forms that change who you are: sign in, sign up, set password.
 *
 * They are client components calling Supabase directly, so NONE of them go
 * through NavForm — which means the in-flight/disabled conventions the rest of
 * the app gets for free do not apply here, and both defects below reached the
 * owner rather than a test.
 *
 * 1. "I can't see if it's signing in, and then it doesn't if I click the button
 *    again." The login handler cleared `loading` immediately after the auth call
 *    and before three more round trips, so the button re-enabled itself while
 *    the work continued. Pressing it again is another attempt against Supabase's
 *    auth rate limit, which we cannot raise — so the UI defect manufactured a
 *    lockout.
 *
 * 2. "It signed out but did not redirect." router.refresh() straight after
 *    router.push() re-fetches the route being LEFT and can drop the push. The
 *    same pair sat on sign-in and set-password, where it would strand someone on
 *    a form whose work had already succeeded.
 */
const FORMS: Array<[string, string[]]> = [
  ['sign in', ['app', 'login', 'page.tsx']],
  ['sign up', ['app', 'signup', 'page.tsx']],
  ['set password', ['app', 'auth', 'set-password', 'page.tsx']],
];

describe('auth forms keep saying they are working until the page changes', () => {
  for (const [label, path] of FORMS) {
    it(`${label}: the in-flight flag is cleared only on a failure path`, () => {
      const src = code(...path);
      /*
       * Measured by BRACE DEPTH, not by nearby text.
       *
       * The first version of this test looked for setError and return within a
       * few hundred characters. It passed when the clear was hoisted onto the
       * main path immediately above `if (error) {`, because the error branch's
       * own setError and return were still inside the window — i.e. it stayed
       * green under the exact bug it was written for. Proven by sabotage.
       *
       * Depth 1 is the handler's own body: the path every successful sign-in
       * runs down. Depth 2+ means the clear is inside a branch, which is where
       * an early exit lives.
       */
      const start = src.search(/async function onSubmit/);
      expect(start, `${label}: no onSubmit handler found`).toBeGreaterThan(-1);
      const clears = [...src.matchAll(/setLoading\(false\)/g)].filter(
        (m) => (m.index ?? 0) > start,
      );
      expect(clears.length, `${label} never clears loading at all`).toBeGreaterThan(0);
      for (const m of clears) {
        const upto = src.slice(start, m.index);
        const depth = (upto.match(/\{/g) ?? []).length - (upto.match(/\}/g) ?? []).length;
        expect(
          depth,
          `${label}: setLoading(false) sits on the handler's main path (depth ${depth}), ` +
            `so the button re-enables while the remaining work runs`,
        ).toBeGreaterThanOrEqual(2);
      }
    });

    it(`${label}: leaves with a hard navigation, not push + refresh`, () => {
      const src = code(...path);
      expect(src, `${label} still uses router.refresh()`).not.toMatch(/router\.refresh\(/);
      expect(src, `${label} still uses a soft router.push()`).not.toMatch(/router\.push\(/);
      expect(src, `${label} has no hard navigation`).toMatch(/window\.location\.(replace|href)/);
    });

    it(`${label}: the submit button reports in-flight and cannot be double-fired`, () => {
      const src = code(...path);
      expect(src, `${label} button is not disabled while working`).toMatch(
        /disabled=\{(loading|pending)\}/,
      );
      // A disabled button with an unchanged label still looks broken.
      expect(src).toMatch(/\{(loading|pending) \?\s*'[^']*…'/);
    });
  }

  it('sign-out follows the same rule, since it is the same failure', () => {
    const btn = code('components', 'sign-out-button.tsx');
    expect(btn).not.toMatch(/router\.refresh\(|router\.push\(/);
    expect(btn).toMatch(/window\.location\.replace/);
    expect(btn).toMatch(/disabled=\{pending\}/);
  });

  it('the rate-limit message is still translated, since the UI can provoke it', () => {
    // Supabase's own limit, which we cannot raise from here — see lib/rate-limit.ts.
    // Worth keeping human, because a person who hits it is already frustrated.
    const src = code('app', 'login', 'page.tsx');
    expect(src).toMatch(/rate limit|too many/i);
    expect(src).toMatch(/Too many attempts/);
  });
});

describe('the destination is resolved by the server, not asked for by the client', () => {
  /*
   * Reported as: "I attempted to sign in, it showed signing in, then it went
   * back to the login form."
   *
   * postSignInDestination() returns '/login' whenever it cannot see a session.
   * Both auth screens called it as a Server Action straight after
   * authenticating — a fetch, made moments after the browser client wrote the
   * session cookie, and not reliably able to see it. So a SUCCESSFUL sign-in
   * resolved its own destination to the login page. Under the old
   * router.push that was a no-op from /login and looked like nothing happening;
   * with a hard navigation it became a visible bounce back to the form.
   *
   * The client no longer needs to know: it goes to /dashboard, which is a full
   * document request where the cookie is unambiguous, and that page resolves the
   * real destination and performs the activation.
   */
  it('neither auth screen asks the client-side for a destination', () => {
    for (const [label, path] of [
      ['sign in', ['app', 'login', 'page.tsx']],
      ['set password', ['app', 'auth', 'set-password', 'page.tsx']],
    ] as const) {
      const src = code(...path);
      expect(src, `${label} still calls postSignInDestination from the browser`).not.toMatch(
        /postSignInDestination/,
      );
      expect(src, `${label} still calls activateMembershipOnSignIn from the browser`).not.toMatch(
        /activateMembershipOnSignIn/,
      );
    }
  });

  it('sign-in leaves for /dashboard, honouring a validated ?next=', () => {
    const src = code('app', 'login', 'page.tsx');
    expect(src).toMatch(/next \?\? '\/dashboard'/);
    // startsWith('/') alone let '//evil.com' through.
    expect(src).toMatch(/safeRedirect\(rawNext, window\.location\.origin\)/);
  });

  it('the dashboard owns both jobs the screens gave up', () => {
    const dash = code('app', 'dashboard', 'page.tsx');
    expect(dash, 'nothing activates an accepted invitation any more').toMatch(
      /await activateMembershipOnSignIn\(\)/,
    );
    expect(dash).toMatch(/await postSignInDestination\(\)/);
  });

  it('and it cannot bounce someone in a loop', () => {
    // Redirecting to '/dashboard' from '/dashboard' would spin.
    const dash = code('app', 'dashboard', 'page.tsx');
    expect(dash).toMatch(/dest !== '\/dashboard'/);
  });

  it('activation failure never blocks reaching the courses', () => {
    const dash = code('app', 'dashboard', 'page.tsx');
    // The CALL, not the import on line 4 — which is what this matched first.
    const at = dash.indexOf('await activateMembershipOnSignIn()');
    expect(at, 'no call found, only an import').toBeGreaterThan(-1);
    expect(dash.slice(Math.max(0, at - 120), at)).toMatch(/try \{/);
  });
});
