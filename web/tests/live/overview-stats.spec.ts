import { test, expect } from '@playwright/test';

const EMAIL = process.env.DEMO_ADMIN_EMAIL ?? 'demo-admin@example.com';
const PASSWORD = process.env.DEMO_ADMIN_PASSWORD ?? '';

// Admin dashboard overview shows real tenant-scoped counts (not "—").
test('admin overview renders live stat counts', async ({ page }) => {
  await page.goto('/login');
  await page.locator('input[type=email]').fill(EMAIL);
  await page.locator('input[type=password]').fill(PASSWORD);
  await page.locator('button[type=submit]').click();
  await page.waitForURL('**/dashboard', { timeout: 20_000 });

  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 20_000 });
  const link = page.getByRole('link', { name: /Published courses/i });
  await expect(link).toBeVisible();
  const text = await link.innerText();
  // Value line is a number, and it is NOT the em-dash placeholder.
  expect(text).toMatch(/\d/);
  expect(text).not.toContain('—');
});
