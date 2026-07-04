import { test, expect } from '@playwright/test';

// Public golden-path entry points. The authenticated path (enroll → complete →
// certificate) requires a seeded Supabase v2 project and is exercised in a
// separate integration suite once that environment exists.

test('platform home renders with auth entry points', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'Training Platform' })).toBeVisible();
  await expect(page.getByRole('link', { name: /sign in/i })).toBeVisible();
  await expect(page.getByRole('link', { name: /start free trial/i })).toBeVisible();
});

test('login page renders the sign-in form', async ({ page }) => {
  await page.goto('/login');
  await expect(page.getByRole('heading', { name: /welcome back/i })).toBeVisible();
  await expect(page.getByPlaceholder('Email')).toBeVisible();
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
