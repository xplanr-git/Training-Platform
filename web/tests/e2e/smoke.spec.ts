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
