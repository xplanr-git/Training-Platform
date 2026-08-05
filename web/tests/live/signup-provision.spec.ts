import { test, expect, requireLiveOptIn } from './fixtures';

// Validates tenant provisioning via /signup against v2: submitting the signup
// form creates a tenant + owner, verified by loading the new tenant's public
// storefront on its subdomain. (Note: on localhost the post-signup redirect to
// the subdomain admin can't carry the host-only session — that works in prod
// via the root-domain cookie; here we assert provisioning, not that redirect.)
requireLiveOptIn();

const stamp = Date.now();
const SLUG = `signup${stamp}`;
const COMPANY = `Signup Co ${stamp}`;
const EMAIL = `signup${stamp}@example.com`;

test('signup provisions a tenant (storefront resolves)', async ({ page, baseURL }) => {
  await page.goto('/signup');
  await page.locator('input[name=name]').fill('Signup Owner');
  await page.locator('input[name=email]').fill(EMAIL);
  await page.locator('input[name=password]').fill('Password123!');
  await page.locator('input[name=companyName]').fill(COMPANY);
  await page.locator('input[name=slug]').fill(SLUG);
  await page.getByRole('button', { name: /create academy/i }).click();

  // Give provisioning + the sign-in/redirect attempt time to complete.
  await page.waitForTimeout(6000);

  // The new tenant's public storefront should now resolve on its subdomain.
  const origin = (baseURL ?? 'http://demo.localhost:3010').replace(/\/\/[^.]+\./, `//${SLUG}.`);
  await page.goto(`${origin}/`);
  await expect(page.getByRole('heading', { name: COMPANY })).toBeVisible({ timeout: 20_000 });
});
