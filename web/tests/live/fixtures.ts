import { test, expect, type Page, type APIRequestContext } from '@playwright/test';

/**
 * Shared preconditions and sign-in for the live suite.
 *
 * Why this file exists, and why the suite is default-OFF:
 *
 * These specs WRITE. Between them they create courses, sections, lessons,
 * enrollments and certificates, and signup-provision.spec.ts creates an entire
 * tenant plus a real auth user. They write to whatever Supabase project the
 * server under test is pointed at — and `web/.env.local` points at the
 * production project, so `npm run test:live` against a local dev server used to
 * leave junk tenants and users in production with no warning at all.
 *
 * So the opt-in is explicit: nothing runs unless ALLOW_LIVE_WRITES=1. Skipped,
 * not failed, because a skip states the precondition; a failure would look like
 * a broken app.
 *
 * The second reason is discoverability. DEMO_ADMIN_EMAIL / DEMO_ADMIN_PASSWORD
 * appeared in no env file and no doc, and the password defaulted to '', so the
 * only way to run this suite was to read the specs and infer it. Four authed
 * journeys sat here unrunnable. They are documented in .env.example now, and
 * env-documented.test.ts fails if a new one goes undocumented.
 */

/** Set to '1' to allow the live suite to write to the target project. */
export const LIVE_WRITES_ALLOWED = process.env.ALLOW_LIVE_WRITES === '1';

/** No defaults: a made-up default address just produces a confusing login failure. */
export const LIVE_EMAIL = process.env.DEMO_ADMIN_EMAIL ?? '';
export const LIVE_PASSWORD = process.env.DEMO_ADMIN_PASSWORD ?? '';

const OPT_IN_MESSAGE =
  'live suite is off by default: it writes courses, enrollments and (in ' +
  'signup-provision) a whole tenant to the project the target server uses. ' +
  'Set ALLOW_LIVE_WRITES=1 to run it, and point it at a NON-PRODUCTION project.';

const CREDS_MESSAGE =
  'set DEMO_ADMIN_EMAIL and DEMO_ADMIN_PASSWORD to an admin on the target ' +
  'project (see .env.example). Without them this spec cannot sign in.';

/**
 * Every spec in tests/live must call this (or requireLiveAdmin, which calls it).
 * live-suite-conventions.test.ts fails if one does not, so a new spec cannot be
 * added that writes to a project without the opt-in.
 */
export function requireLiveOptIn(): void {
  test.beforeEach(() => {
    test.skip(!LIVE_WRITES_ALLOWED, OPT_IN_MESSAGE);
  });
}

/** As above, plus the credentials that signInAsAdmin needs. */
export function requireLiveAdmin(): void {
  requireLiveOptIn();
  test.beforeEach(() => {
    test.skip(!LIVE_EMAIL || !LIVE_PASSWORD, CREDS_MESSAGE);
  });
}

/**
 * Sign in on the tenant subdomain. The session cookie is host-scoped here, so
 * this must run against the same origin the spec then navigates within.
 *
 * Admins land on /admin after login; learners land on /dashboard.
 */
export async function signInAsAdmin(page: Page): Promise<void> {
  await page.goto('/login');
  await page.locator('input[type=email]').fill(LIVE_EMAIL);
  await page.locator('input[type=password]').fill(LIVE_PASSWORD);
  await page.locator('button[type=submit]').click();
  await page.waitForURL('**/admin', { timeout: 20_000 });
}

/* ── RLS attack probes (rls-attacks.spec.ts) ─────────────────────────────── */

/**
 * The probe suite attacks PostgREST directly with a learner's own session, to
 * prove migration 0014 actually closed the privilege-escalation hole. It writes
 * — that is the entire point — so it gets its own target variables rather than
 * reusing the app's.
 *
 * That separation is the safety mechanism, not tidiness. If these read
 * NEXT_PUBLIC_SUPABASE_URL they would inherit whatever `.env.local` holds, and
 * `.env.local` points at PRODUCTION. There is no default and no fallback: the
 * only way to aim these at production is to type the production URL into a
 * variable with PROBE in its name, and even then the equality check below stops
 * it.
 */
export const RLS_PROBE_URL = process.env.RLS_PROBE_SUPABASE_URL ?? '';
export const RLS_PROBE_ANON_KEY = process.env.RLS_PROBE_ANON_KEY ?? '';
export const RLS_PROBE_EMAIL = process.env.RLS_PROBE_LEARNER_EMAIL ?? '';
export const RLS_PROBE_PASSWORD = process.env.RLS_PROBE_LEARNER_PASSWORD ?? '';

const PROBE_MESSAGE =
  'RLS probes are off: set RLS_PROBE_SUPABASE_URL, RLS_PROBE_ANON_KEY, ' +
  'RLS_PROBE_LEARNER_EMAIL and RLS_PROBE_LEARNER_PASSWORD to a DISPOSABLE ' +
  'Supabase project seeded with a learner (see .env.example). These probes ' +
  'attempt privilege escalation and forged writes.';

const PROBE_IS_PRODUCTION =
  'refusing to run: RLS_PROBE_SUPABASE_URL is the same project the app is ' +
  'configured against (NEXT_PUBLIC_SUPABASE_URL). These probes write. Point ' +
  'them at a disposable project.';

/**
 * Opt-in for the probe suite: the live-suite gate, plus a target that is
 * explicitly not the project the app is pointed at.
 */
export function requireRlsProbeTarget(): void {
  requireLiveOptIn();
  test.beforeEach(() => {
    test.skip(
      !RLS_PROBE_URL || !RLS_PROBE_ANON_KEY || !RLS_PROBE_EMAIL || !RLS_PROBE_PASSWORD,
      PROBE_MESSAGE,
    );
    const appUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
    test.skip(
      !!appUrl && RLS_PROBE_URL.replace(/\/$/, '') === appUrl.replace(/\/$/, ''),
      PROBE_IS_PRODUCTION,
    );
  });
}

/** Signs the seeded learner in via the Auth REST API and returns their access token. */
export async function learnerAccessToken(request: APIRequestContext): Promise<string> {
  const res = await request.post(`${RLS_PROBE_URL}/auth/v1/token?grant_type=password`, {
    headers: { apikey: RLS_PROBE_ANON_KEY, 'Content-Type': 'application/json' },
    data: { email: RLS_PROBE_EMAIL, password: RLS_PROBE_PASSWORD },
  });
  expect(res.status(), `learner sign-in failed: ${await res.text()}`).toBe(200);
  const body = (await res.json()) as { access_token?: string };
  expect(body.access_token, 'no access_token in the sign-in response').toBeTruthy();
  return body.access_token!;
}

export { test, expect };
