import { test, expect } from '@playwright/test';

/**
 * Live authed golden path against the running v2 dev server, driven on the
 * `demo` tenant subdomain. Requires the dev server on :3010 and env creds:
 *   DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD
 *
 * Flow: login → create course → add section+lesson → publish → enroll →
 * complete lesson → certificate → verify.
 */
const EMAIL = process.env.DEMO_ADMIN_EMAIL ?? 'demo-admin@example.com';
const PASSWORD = process.env.DEMO_ADMIN_PASSWORD ?? '';

const stamp = Date.now();
const TITLE = `Golden Path ${stamp}`;
const SLUG = TITLE.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

test('authored course → enroll → complete → certificate → verify', async ({ page }) => {
  // 1. Log in on the tenant subdomain (session cookie is host-scoped here).
  await page.goto('/login');
  await page.locator('input[type=email]').fill(EMAIL);
  await page.locator('input[type=password]').fill(PASSWORD);
  await page.locator('button[type=submit]').click();
  // Admins land on /admin after login (learners on /dashboard).
  await page.waitForURL('**/admin', { timeout: 20_000 });

  // 2. Create a course.
  await page.goto('/admin/courses/new');
  await page.locator('input[name=title]').fill(TITLE);
  await page.getByRole('button', { name: 'Create course' }).click();
  await page.waitForURL(/\/admin\/courses\/[0-9a-f-]{36}$/, { timeout: 20_000 });

  // 3. Add a section, then a text lesson, in the builder.
  const courseUrl = new URL(page.url());
  const builderUrl = `${courseUrl.pathname}/builder`;
  await page.goto(builderUrl);
  await page.getByPlaceholder('New section title').fill('Module 1');
  await page.getByRole('button', { name: 'Add section' }).click();
  await expect(page.getByText('Module 1')).toBeVisible();

  await page.getByPlaceholder('Lesson title').fill('Welcome');
  await page.getByRole('button', { name: 'Add lesson' }).click();
  await expect(page.getByText('Welcome')).toBeVisible();

  // 4. Publish via the edit page.
  await page.goto(courseUrl.pathname);
  await page.locator('select[name=status]').selectOption('published');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.waitForTimeout(1500);

  // 5. Enroll from the public course landing.
  await page.goto(`/courses/${SLUG}`);
  await expect(page.getByRole('heading', { name: TITLE })).toBeVisible();
  await page.getByRole('button', { name: /enroll for free/i }).click();
  await page.waitForURL(`**/learn/${SLUG}`, { timeout: 20_000 });

  // 6. The learn page renders right after the enroll (client-nav via NavForm).
  await expect(page.getByRole('heading', { name: TITLE })).toBeVisible({ timeout: 20_000 });
  await page.getByRole('link', { name: /start course|continue/i }).click();
  await page.waitForURL(`**/learn/${SLUG}/**`, { timeout: 20_000 });
  await page.getByRole('button', { name: /complete course|complete & continue/i }).click();
  await page.waitForURL(`**/learn/${SLUG}`, { timeout: 20_000 });

  // 7. This course's certificate → public verify page shows Valid.
  await page.goto('/dashboard');
  const card = page.locator('a', { hasText: TITLE }).locator('xpath=ancestor::div[1]');
  const certLink = card.getByRole('link', { name: /view certificate/i });
  await expect(certLink).toBeVisible({ timeout: 20_000 });
  const href = await certLink.getAttribute('href');
  expect(href).toContain('/verify/');

  await page.goto(href!);
  await expect(page.getByText(/valid certificate/i)).toBeVisible({ timeout: 20_000 });
  await expect(page.getByText(TITLE)).toBeVisible();
});
