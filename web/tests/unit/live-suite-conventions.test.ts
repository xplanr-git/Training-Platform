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
    const unguarded = specs.filter((f) => !/require(LiveOptIn|LiveAdmin)\(\)/.test(code(f)));
    expect(
      unguarded,
      `these could write to the target project with no opt-in: ${unguarded.join(', ')}`,
    ).toEqual([]);
  });

  it('the opt-in is off unless ALLOW_LIVE_WRITES is exactly "1"', () => {
    const fx = readFileSync(join(LIVE_DIR, 'fixtures.ts'), 'utf8');
    expect(fx).toMatch(/ALLOW_LIVE_WRITES === '1'/);
    // Skip, not fail: a skip states a precondition, a failure looks like a bug.
    expect(fx).toMatch(/test\.skip\(!LIVE_WRITES_ALLOWED/);
  });

  it('no spec re-rolls the login flow instead of using signInAsAdmin', () => {
    // A hand-rolled login would also re-introduce the empty-password default.
    const rolled = specs.filter((f) => /page\.goto\('\/login'\)/.test(code(f)));
    expect(rolled, `should call signInAsAdmin: ${rolled.join(', ')}`).toEqual([]);
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
