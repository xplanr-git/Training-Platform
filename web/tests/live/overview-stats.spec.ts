import { test, expect, requireLiveAdmin, signInAsAdmin } from './fixtures';

// Admin dashboard overview shows real tenant-scoped counts (not "—").
requireLiveAdmin();

test('admin overview renders live stat counts', async ({ page }) => {
  await signInAsAdmin(page);

  await page.goto('/admin');
  await expect(page.getByRole('heading', { name: 'Dashboard' })).toBeVisible({ timeout: 20_000 });
  const link = page.getByRole('link', { name: /Published courses/i });
  await expect(link).toBeVisible();
  const text = await link.innerText();
  // Value line is a number, and it is NOT the em-dash placeholder.
  expect(text).toMatch(/\d/);
  expect(text).not.toContain('—');
});
