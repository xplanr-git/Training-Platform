import { describe, it, expect } from 'vitest';
import { readFileSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

const WEB = resolve(process.cwd());
const LIVE_DIR = join(WEB, 'tests', 'live');
const specs = readdirSync(LIVE_DIR).filter((f) => f.endsWith('.spec.ts'));
const read = (f: string) => readFileSync(join(LIVE_DIR, f), 'utf8');
/** Strip comments — four earlier guards in this repo were satisfied by their own prose. */
const code = (f: string) =>
  read(f)
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');

describe('the live suite cannot write to a project by accident', () => {
  /*
   * `npm run test:live` drives a running dev server. web/.env.local points that
   * server at the PRODUCTION Supabase project, and these specs write: courses,
   * sections, lessons, enrollments, certificates, and in signup-provision.spec.ts
   * an entire tenant plus a real auth user. There was no guard of any kind — one
   * command, and production gains a junk tenant named signup<timestamp>.
   *
   * So every spec must go through requireLiveOptIn (directly or via
   * requireLiveAdmin), which skips unless ALLOW_LIVE_WRITES=1.
   */
  it('there are specs to check', () => {
    expect(specs.length).toBeGreaterThanOrEqual(4);
  });

  it('every spec requires the explicit opt-in', () => {
    // requireRlsProbeTarget is the third gate (tests/live/rls-attacks.spec.ts).
    // It is only admissible here because it calls requireLiveOptIn() itself —
    // asserted in the next test, so adding a name to this list cannot become a
    // way around the opt-in.
    const unguarded = specs.filter(
      (f) => !/require(LiveOptIn|LiveAdmin|RlsProbeTarget)\(\)/.test(code(f)),
    );
    expect(
      unguarded,
      `these could write to the target project with no opt-in: ${unguarded.join(', ')}`,
    ).toEqual([]);
  });

  it('every gate helper ultimately goes through requireLiveOptIn', () => {
    const fx = readFileSync(join(LIVE_DIR, 'fixtures.ts'), 'utf8');
    /** Body of an exported gate helper, so prose in its doc comment cannot satisfy this. */
    const bodyOf = (name: string) => {
      const start = fx.indexOf(`export function ${name}(): void {`);
      expect(start, `${name} not found in fixtures.ts`).toBeGreaterThan(-1);
      return fx.slice(start, fx.indexOf('\n}', start));
    };
    for (const gate of ['requireLiveAdmin', 'requireRlsProbeTarget']) {
      expect(bodyOf(gate), `${gate} must delegate to requireLiveOptIn`).toMatch(
        /requireLiveOptIn\(\)/,
      );
    }
  });

  it('the RLS probes cannot be aimed at the project the app uses', () => {
    /*
     * These probes attempt privilege escalation and forged writes. They take a
     * dedicated RLS_PROBE_SUPABASE_URL rather than reading the app's
     * NEXT_PUBLIC_SUPABASE_URL, precisely so they cannot inherit .env.local —
     * which points at production. The equality check is the second lock.
     */
    const fx = readFileSync(join(LIVE_DIR, 'fixtures.ts'), 'utf8');
    expect(fx).toMatch(/RLS_PROBE_SUPABASE_URL/);
    expect(fx).toMatch(/RLS_PROBE_URL\.replace\(\/\\\/\$\/, ''\) === appUrl\.replace/);
    const spec = readFileSync(join(LIVE_DIR, 'rls-attacks.spec.ts'), 'utf8');
    // A fallback to the app's own project would defeat the separation entirely.
    expect(spec).not.toMatch(/NEXT_PUBLIC_SUPABASE_URL/);
  });

  it('the opt-in is off unless ALLOW_LIVE_WRITES is exactly "1"', () => {
    const fx = readFileSync(join(LIVE_DIR, 'fixtures.ts'), 'utf8');
    expect(fx).toMatch(/ALLOW_LIVE_WRITES === '1'/);
    // Skip, not fail: a skip states a precondition, a failure looks like a bug.
    expect(fx).toMatch(/test\.skip\(!LIVE_WRITES_ALLOWED/);
  });

  it('no spec re-rolls the login flow instead of using signInAsAdmin', () => {
    /*
     * A hand-rolled login would also re-introduce the empty-password default.
     *
     * ONE exemption: sign-in-journeys.spec.ts is the spec whose SUBJECT is the
     * login flow. It cannot use signInAsAdmin, because that helper waits for
     * `**​/admin` and most of these cases must land somewhere else — on
     * /dashboard, on a ?next= target, or back with the session cleared. The
     * property the rule protects is enforced for it by the next test instead.
     */
    const DRIVES_LOGIN_BY_DESIGN = ['sign-in-journeys.spec.ts'];
    const rolled = specs
      .filter((f) => !DRIVES_LOGIN_BY_DESIGN.includes(f))
      .filter((f) => /page\.goto\('\/login'\)/.test(code(f)));
    expect(rolled, `should call signInAsAdmin: ${rolled.join(', ')}`).toEqual([]);
  });

  it('a spec that does drive the login form uses the fixture credentials', () => {
    /*
     * The real risk in a hand-rolled login is not the navigation, it is
     * hardcoded or defaulted credentials — the original bug was a password
     * defaulting to '', which turned a missing precondition into a confusing
     * assertion failure twenty seconds later. So the exempted spec must take
     * its credentials from fixtures.ts and must not contain a literal one.
     */
    const src = code('sign-in-journeys.spec.ts');
    expect(src).toMatch(/LIVE_EMAIL/);
    expect(src).toMatch(/LIVE_PASSWORD/);
    expect(src, 'a literal password in a spec').not.toMatch(/fill\(\s*'(?!\s*')[^']{3,}'\s*\)/);
  });

  it('credentials have no fabricated defaults', () => {
    const fx = readFileSync(join(LIVE_DIR, 'fixtures.ts'), 'utf8');
    // The old `?? 'demo-admin@example.com'` default turned a missing-credential
    // precondition into a login assertion failure 20 seconds later.
    expect(fx).not.toMatch(/DEMO_ADMIN_EMAIL \?\? '[^']+'/);
    expect(fx).not.toMatch(/DEMO_ADMIN_PASSWORD \?\? '[^']+'/);
  });
});

describe('the CI e2e run cannot pick up a writing spec', () => {
  /*
   * The separation is load-bearing: tests/e2e is public-page-only and runs on
   * every push, tests/live writes and runs by hand. If the CI config's testDir
   * ever widened to include tests/live, CI would attempt to create tenants.
   */
  // Comments stripped: the live config's own doc comment says "No webServer —
  // start the dev server first", which satisfied the assertion below on prose alone.
  const strip = (s: string) => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/^\s*\/\/.*$/gm, '');
  const ci = strip(readFileSync(join(WEB, 'playwright.config.ts'), 'utf8'));
  const live = strip(readFileSync(join(WEB, 'playwright.live.config.ts'), 'utf8'));

  it('CI config points only at tests/e2e', () => {
    expect(ci).toMatch(/testDir:\s*'\.\/tests\/e2e'/);
    expect(ci).not.toMatch(/tests\/live/);
  });

  it('the live config points only at tests/live and starts no server of its own', () => {
    expect(live).toMatch(/testDir:\s*'\.\/tests\/live'/);
    // A webServer here would run `next build && next start` against production env.
    expect(live).not.toMatch(/webServer/);
  });

  it('the CI e2e directory holds no spec that writes', () => {
    const e2e = readdirSync(join(WEB, 'tests', 'e2e')).filter((f) => f.endsWith('.spec.ts'));
    for (const f of e2e) {
      const src = readFileSync(join(WEB, 'tests', 'e2e', f), 'utf8');
      expect(src, `${f} appears to submit a form in the CI suite`).not.toMatch(
        /getByRole\('button', \{ name: \/?(create academy|create course|enroll)/i,
      );
    }
  });
});
