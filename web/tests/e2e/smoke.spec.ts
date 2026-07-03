import { test, expect } from '@playwright/test';

// Golden-path smoke: the platform marketing page renders and links to auth.
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
