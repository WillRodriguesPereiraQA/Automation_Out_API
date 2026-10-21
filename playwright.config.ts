import { defineConfig } from '@playwright/test';

const useMock = process.env.REQRES_MOCK === '1';

export default defineConfig({
  testDir: './tests',
  timeout: 60_000,
  // Independent tests run in parallel against the local mock. The hosted API
  // stays on one worker because of the anonymous daily quota.
  fullyParallel: useMock,
  retries: process.env.CI ? 1 : 0,
  workers: useMock ? 4 : 1,
  globalSetup: './global-setup.ts',
  globalTeardown: './global-teardown.ts',
  reporter: process.env.CI
    ? [
        ['list'],
        ['html', { open: 'never', outputFolder: 'playwright-report' }],
        ['junit', { outputFile: 'test-results/junit.xml' }],
        ['json', { outputFile: 'test-results/results.json' }],
        ['github'],
      ]
    : [
        ['list'],
        ['html', { open: 'never', outputFolder: 'playwright-report' }],
      ],
  use: {
    baseURL: 'https://reqres.in/api',
    extraHTTPHeaders: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  },
});
