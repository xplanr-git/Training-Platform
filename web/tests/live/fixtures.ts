import { test, expect, type Page } from '@playwright/test';

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

export { test, expect };
