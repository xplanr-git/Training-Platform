import { test, expect, requireLiveAdmin, LIVE_EMAIL, LIVE_PASSWORD } from './fixtures';

/**
 * The sign-in journey, end to end, as a person actually experiences it.
 *
 * WHY THIS EXISTS. The last four commits on this branch were all fixes to the
 * same thirty seconds of user experience:
 *
 *   623f4ba  stop a successful sign-in resolving its destination to /login
 *   1965ba9  keep the sign-in button busy until the page actually changes
 *   30a0419  make signing out leave, and stop it waiting on work nobody sees
 *   47e8872  give the catalogue a header, since / now lands there
 *
 * Every one was found by a person reporting it, because the destination logic
 * is spread across the client page, middleware.ts, lib/host.ts's rewrite rules,
 * dashboard/page.tsx and two Server Actions — and the session cookie is
 * reliably visible to some of those and not others. Each fix moved work between
 * layers and exposed the next seam. Nothing tested the whole path, so the next
 * regression would have shipped exactly the way the last four did.
 *
 * These assert the OUTCOME (where you end up, signed in, with the page you
 * asked for) rather than the mechanism, so a future consolidation that moves the
 * resolver again is free to do so as long as the journey still works.
 */

requireLiveAdmin();

/** Fills and submits the sign-in form. Deliberately not fixtures' signInAsAdmin,
 *  which waits for /admin — half these cases must land somewhere else. */
async function submitSignIn(page: import('@playwright/test').Page) {
  await page.locator('input[type=email]').fill(LIVE_EMAIL);
  await page.locator('input[type=password]').fill(LIVE_PASSWORD);
  await page.locator('button[type=submit]').click();
}

test.describe('signing in lands somewhere real', () => {
  test.beforeEach(async ({ context }) => {
    // Each case starts signed out. Without this the second test would already
    // hold a session and skip the very thing under test.
    await context.clearCookies();
  });

  test('a plain sign-in never comes back to the login form', async ({ page }) => {
    /*
     * The exact regression 623f4ba fixed. postSignInDestination returns '/login'
     * whenever it cannot see a session, and as a Server Action called from the
     * browser it could not reliably see the cookie the client had just written —
     * so a SUCCESSFUL sign-in resolved its destination to the login page and
     * bounced straight back to the form.
     */
    await page.goto('/login');
    await submitSignIn(page);

    await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20_000 });
    expect(page.url(), 'signed in but returned to the login form').not.toContain('/login');

    // And it is a real signed-in page, not an error or an empty shell.
    await expect(page.locator('body')).not.toContainText('Invalid login credentials');
    await expect(page.getByRole('button', { name: /^sign in$/i })).toHaveCount(0);
  });

  test('the sign-in button stays busy until the page actually changes', async ({ page }) => {
    /*
     * 1965ba9. `loading` was cleared unconditionally, so on SUCCESS the button
     * went back to "Sign in" and re-enabled itself while three round trips were
     * still in flight. Nothing on screen changed for a second or more, so the
     * natural response was to press it again — and every extra press is another
     * attempt against Supabase's auth rate limit, which is not ours to raise.
     */
    await page.goto('/login');
    await page.locator('input[type=email]').fill(LIVE_EMAIL);
    await page.locator('input[type=password]').fill(LIVE_PASSWORD);

    const button = page.locator('button[type=submit]');
    await button.click();
    // Either it is still disabled, or we have already left. Both are correct;
    // what must never happen is an enabled "Sign in" button on the login page.
    await expect
      .poll(
        async () => {
          if (!page.url().includes('/login')) return 'left';
          return (await button.isDisabled()) ? 'busy' : 'idle';
        },
        { timeout: 20_000, message: 'the button went idle while still on /login' },
      )
      .not.toBe('idle');
  });

  test('?next= is honoured', async ({ page }) => {
    const target = '/dashboard';
    await page.goto(`/login?next=${encodeURIComponent(target)}`);
    await submitSignIn(page);

    await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20_000 });
    expect(page.url()).toContain(target);
  });

  test('an off-origin ?next= is refused rather than followed', async ({ page, baseURL }) => {
    /*
     * safeRedirect validates by RESOLUTION, not by pattern, because rejecting
     * bad shapes one at a time never converged — '//host' was blocked while
     * '/\host' still resolved off-origin.
     */
    await page.goto('/login?next=' + encodeURIComponent('//example.com/'));
    await submitSignIn(page);

    await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20_000 });
    expect(new URL(page.url()).host, 'followed an off-origin next=').toBe(new URL(baseURL!).host);
  });

  test('a signed-in session survives a reload of the landing page', async ({ page }) => {
    /*
     * The reported symptom was "sign in, the page refreshes, and I get the login
     * form again". A session that authenticates but does not SURVIVE the next
     * document request is the stale-duplicate-cookie failure: commit 083f1ac
     * added a domain-scoped auth cookie, and a browser holding the older
     * host-only one sends both, so the server can read the stale one, getUser()
     * returns null, and the dashboard bounces to /login indefinitely.
     */
    await page.goto('/login');
    await submitSignIn(page);
    await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20_000 });

    const landed = page.url();
    await page.reload();
    await expect.poll(() => page.url(), { timeout: 15_000 }).not.toContain('/login');
    expect(new URL(page.url()).pathname).toBe(new URL(landed).pathname);
  });

  test('signing out leaves, and does not leave a usable session behind', async ({ page }) => {
    /*
     * 30a0419. router.refresh() fired straight after router.push() re-fetched
     * the route being LEFT and could drop the pending push, producing "it signed
     * out but did not redirect".
     */
    await page.goto('/login');
    await submitSignIn(page);
    await page.waitForURL((url) => !url.pathname.startsWith('/login'), { timeout: 20_000 });

    const signOut = page.getByRole('button', { name: /sign out/i }).first();
    if ((await signOut.count()) === 0) test.skip(true, 'no sign-out control on this landing page');
    await signOut.click();

    await page.waitForURL(/\/(login|)$/, { timeout: 20_000 });
    // The session must actually be gone, not merely navigated away from.
    await page.goto('/dashboard');
    await expect
      .poll(() => page.url(), { timeout: 15_000, message: '/dashboard served after sign-out' })
      .toContain('/login');
  });
});

test.describe('a signed-out visitor is sent to sign in, not to a 404', () => {
  test.beforeEach(async ({ context }) => {
    await context.clearCookies();
  });

  for (const path of ['/dashboard', '/admin', '/platform']) {
    test(`${path} redirects to the login form`, async ({ page }) => {
      await page.goto(path);
      await expect
        .poll(() => page.url(), { timeout: 15_000, message: `${path} did not reach /login` })
        .toContain('/login');
    });
  }

  test('and the login form remembers where they were going', async ({ page }) => {
    // Otherwise signing in dumps them at a default page and they have to
    // navigate back to whatever they clicked.
    await page.goto('/platform');
    await expect.poll(() => page.url(), { timeout: 15_000 }).toContain('/login');
    expect(decodeURIComponent(page.url())).toContain('next=/platform');
  });
});
