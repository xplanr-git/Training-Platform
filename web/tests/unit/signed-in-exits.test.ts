import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const read = (p: string) => readFileSync(join(process.cwd(), p), 'utf8').replace(/\r\n/g, '\n');

/**
 * Every surface a signed-in person can land on has to offer a way out.
 *
 * SignOutButton's own note gives the reason: it "needs to be reachable from every
 * signed-in surface" because dealers share site and office machines. The apex
 * `/dashboard` fallback had neither a sign-out nor a single link — a heading and
 * one paragraph — and it is the *guaranteed* destination for anyone whose join
 * request has not been accepted yet. Someone signed in on the wrong account, on a
 * shared machine, could not correct it without editing the address bar.
 *
 * Listed explicitly rather than globbed: "a page a signed-in user can land on" is
 * not something a regex can decide, and a glob that quietly matched nothing would
 * pass while checking nothing.
 */
const SIGNED_IN_LANDINGS = [
  ['apex fallback dashboard', 'src/app/dashboard/page.tsx'],
  ['learner dashboard', 'src/app/t/[slug]/dashboard/page.tsx'],
  ['admin shell', 'src/components/admin-shell.tsx'],
  ['tenant storefront', 'src/app/t/[slug]/page.tsx'],
] as const;

describe('a signed-in user is never stranded', () => {
  for (const [name, path] of SIGNED_IN_LANDINGS) {
    it(`${name} offers sign-out`, () => {
      // V2: the learner dashboard's sign-out now lives in the persistent
      // LearnerShell it renders (Home/My training/Help/Account + sign-out), so
      // the shell is the provider there. Every other landing still carries the
      // button directly.
      const pattern = path.endsWith('t/[slug]/dashboard/page.tsx')
        ? /<SignOutButton|<LearnerShell/
        : /<SignOutButton/;
      expect(read(path), `${path} renders no sign-out affordance`).toMatch(pattern);
    });
  }

  it('the apex fallback also offers somewhere to go', () => {
    // Sign-out alone would still leave a pending user with nothing to do but
    // leave. The catalogue is the one destination that works before a membership
    // is accepted.
    const src = read('src/app/dashboard/page.tsx');
    expect(src).toMatch(/<Link href="\/">/);
  });

  it('covers every landing listed', () => {
    // Guards the guard: an empty list would make the loop above assert nothing.
    expect(SIGNED_IN_LANDINGS.length).toBeGreaterThanOrEqual(4);
  });
});
