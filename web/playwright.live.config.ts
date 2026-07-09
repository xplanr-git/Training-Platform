import { defineConfig, devices } from '@playwright/test';

/**
 * Live golden-path config: drives the ALREADY-RUNNING dev server on a tenant
 * subdomain (Chromium resolves *.localhost, which the preview harness can't).
 * No webServer — start the dev server first (port 3010). Point at the `demo`
 * tenant. Run: npx playwright test --config playwright.live.config.ts
 */
export default defineConfig({
  testDir: './tests/live',
  timeout: 60_000,
  fullyParallel: false,
  workers: 1,
  retries: 0,
  use: {
    baseURL: 'http://demo.localhost:3010',
    trace: 'retain-on-failure',
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
});
