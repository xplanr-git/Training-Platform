import { test, expect, requireLiveAdmin, signInAsAdmin } from './fixtures';

// Live quiz sub-flow: author a quiz lesson + MCQ question, publish, enroll,
// answer correctly, and confirm the pass gates course completion → certificate.

requireLiveAdmin();

const stamp = Date.now();
const TITLE = `Quiz Path ${stamp}`;
const SLUG = TITLE.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

test('quiz authoring → attempt → pass → completion → certificate', async ({ page }) => {
  // Login (subdomain-scoped session).
  await signInAsAdmin(page);

  // Create course.
  await page.goto('/admin/courses/new');
  await page.locator('input[name=title]').fill(TITLE);
  await page.getByRole('button', { name: 'Create course' }).click();
  await page.waitForURL(/\/admin\/courses\/[0-9a-f-]{36}$/, { timeout: 20_000 });
  const coursePath = new URL(page.url()).pathname;

  // Builder: add a section and a quiz lesson.
  await page.goto(`${coursePath}/builder`);
  await page.getByPlaceholder('New section title').fill('Assessment');
  await page.getByRole('button', { name: 'Add section' }).click();
  await expect(page.getByText('Assessment')).toBeVisible();

  await page.getByPlaceholder('Lesson title').fill('Final Quiz');
  await page.locator('select[name=type]').first().selectOption('quiz');
  await page.getByRole('button', { name: 'Add lesson' }).click();
  await expect(page.getByRole('link', { name: 'Edit quiz' })).toBeVisible({ timeout: 20_000 });

  // Author one MCQ question (correct = option #2 → "Four", 0-based index 1).
  await page.getByRole('link', { name: 'Edit quiz' }).click();
  await page.waitForURL('**/builder/quiz/**', { timeout: 20_000 });
  await page.locator('input[name=prompt]').fill('What is 2 + 2?');
  await page.locator('select[name=type]').selectOption('mcq');
  await page.locator('textarea[name=options]').fill('Three\nFour\nFive');
  // The answer key is a radio beside the option's own text now, not a typed
  // number — the options must be entered first for it to exist at all.
  await page.getByRole('radio', { name: /Four/ }).check();
  await page.getByRole('button', { name: 'Add question' }).click();
  await expect(page.getByText('What is 2 + 2?')).toBeVisible({ timeout: 20_000 });

  // Publish.
  await page.goto(coursePath);
  await page.locator('select[name=status]').selectOption('published');
  await page.getByRole('button', { name: 'Save changes' }).click();
  await page.waitForTimeout(1500);

  // Enroll and open the quiz lesson.
  await page.goto(`/courses/${SLUG}`);
  await page.getByRole('button', { name: /enroll for free/i }).click();
  await page.waitForURL(`**/learn/${SLUG}`, { timeout: 20_000 });
  await page.getByRole('link', { name: /start course|continue/i }).click();
  await page.waitForURL(`**/learn/${SLUG}/**`, { timeout: 20_000 });

  // Answer correctly ("Four" = value 1) and submit.
  await page.locator('input[type=radio][value="1"]').check();
  await page.getByRole('button', { name: /submit quiz/i }).click();
  await expect(page.getByText(/you have passed this quiz/i)).toBeVisible({ timeout: 20_000 });

  // Completion → certificate on the dashboard.
  await page.goto('/dashboard');
  const card = page.locator('a', { hasText: TITLE }).locator('xpath=ancestor::div[1]');
  const certLink = card.getByRole('link', { name: /view certificate/i });
  await expect(certLink).toBeVisible({ timeout: 20_000 });
  const href = await certLink.getAttribute('href');
  await page.goto(href!);
  await expect(page.getByText(/valid certificate/i)).toBeVisible({ timeout: 20_000 });
});
