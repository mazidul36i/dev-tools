import { defineConfig, devices } from '@playwright/test';

const PORT = 4175;

/**
 * End-to-end and accessibility checks against a production build.
 * `npm run e2e` builds, serves `dist` with `vite preview`, and runs Chromium.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: 'off',
  },
  webServer: {
    command: `npm run build && npx vite preview --port ${PORT} --strictPort`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'desktop',
      testIgnore: /responsive\.spec/,
      use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 860 } },
    },
    {
      name: 'phone',
      testMatch: /responsive\.spec/,
      // iPhone 13 metrics and touch, rendered by Chromium (the only browser installed in CI).
      use: { ...devices['iPhone 13'], browserName: 'chromium' },
    },
  ],
});
