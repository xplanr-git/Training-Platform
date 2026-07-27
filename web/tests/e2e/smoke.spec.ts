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
  await expect(page.getByPlaceholder('Company / academy name')).toBeVisible();
});

test('responses carry security headers', async ({ request }) => {
  const res = await request.get('/');
  expect(res.headers()['x-content-type-options']).toBe('nosniff');
  expect(res.headers()['x-frame-options']).toBe('SAMEORIGIN');
});
