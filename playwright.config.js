// @ts-check
const { defineConfig, devices } = require('@playwright/test');
require('dotenv').config();

// Playwright config. Docs: https://playwright.dev/docs/test-configuration
module.exports = defineConfig({
  testDir: './tests',
  outputDir: './reports/artifacts',   // traces, screenshots, videos per test

  forbidOnly: !!process.env.CI,   // fail the build if someone left a test.only in

  // OTP timing can be flaky, so give CI runs a couple of retries.
  retries: process.env.CI ? 2 : 1,

  // Each run needs its own OTP, so running tests in parallel would just
  // race against the same inbox. Keeping it serial for now.
  workers: process.env.CI ? 1 : (process.env.WORKERS ? Number(process.env.WORKERS) : 1),
  fullyParallel: false,

  timeout: 120 * 1000,            // whole test: signup + email OTP polling
  expect: { timeout: 15 * 1000 }, // individual assertions

  reporter: [
    ['list'],
    ['html', { outputFolder: 'reports/html', open: 'never' }],
    ['json', { outputFile: 'reports/results.json' }],
  ],

  use: {
    baseURL: process.env.BASE_URL || 'https://authorized-partner.vercel.app/',
    actionTimeout: 15 * 1000,
    navigationTimeout: 30 * 1000,

    // Only keep traces/screenshots/video when a test actually fails.
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    headless: process.env.HEADED ? false : true,
    viewport: { width: 1366, height: 900 },
    ignoreHTTPSErrors: true,
  },

  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // Uncomment to broaden coverage:
    // { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
    // { name: 'webkit',  use: { ...devices['Desktop Safari'] } },
  ],
});
