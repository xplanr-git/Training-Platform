import { test, expect } from '@playwright/test';

// Public entry points (unauthenticated). The authenticated golden path is
// covered by the live suite (tests/live/*) against a seeded Supabase project.

test('platform home renders with a sign-in entry point', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Outdure Academy' })).toBeVisible();
  await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
});

test('login page renders the sign-in form', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('input[type=email]')).toBeVisible();
  await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
});

test('signup page renders the academy-creation form', async ({ page }) => {
  await page.goto('/signup');
  await expect(page.getByRole('heading', { name: /create your academy/i })).toBeVisible();
  // By LABEL, not by placeholder. This assertion used to read
  // getByPlaceholder('Company / academy name') and broke when the accessibility pass
  // gave these fields real <Label>s — a placeholder is not an accessible name, since
  // it disappears the moment anyone types. Asserting the label tests what a screen
  // reader and a voice-control user actually get, and it cannot be broken by the same
  // improvement twice.
  await expect(page.getByLabel('Company / academy name')).toBeVisible();
  await expect(page.getByLabel('Work email')).toBeVisible();
  await expect(page.getByLabel('Your web address')).toBeVisible();
});

test('responses carry security headers', async ({ request }) => {
  const res = await request.get('/');
  expect(res.headers()['x-content-type-options']).toBe('nosniff');
  expect(res.headers()['x-frame-options']).toBe('SAMEORIGIN');
});

test('responses carry a Content-Security-Policy that confines exfiltration', async ({
  request,
}) => {
  /*
   * Six security headers were set and CSP was not — the one that matters most
   * here. The Supabase auth cookie is scoped to the whole domain and is
   * necessarily JS-readable, so one XSS on any subdomain yields tokens for every
   * session on the platform. connect-src is what stops injected script posting
   * them anywhere.
   */
  const res = await request.get('/');
  const csp = res.headers()['content-security-policy'];
  expect(csp, 'no Content-Security-Policy header').toBeTruthy();

  for (const directive of [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "form-action 'self'",
    "frame-ancestors 'self'",
  ]) {
    expect(csp, `missing: ${directive}`).toContain(directive);
  }

  // The point of the policy: a fixed allowlist, not a wildcard.
  expect(csp).toContain('connect-src');
  expect(csp, 'connect-src must not be open').not.toMatch(/connect-src[^;]*\*(?!\.)/);
  // The video embed has to stay framed, or every video lesson goes blank.
  expect(csp).toContain('https://iframe.mediadelivery.net');
});
