import { defineConfig } from '@playwright/test';
// @ts-ignore
import { resolveSite } from './scripts/site-config.mjs';

const { base } = resolveSite();
const port = 4321;
export const BASE_URL = `http://localhost:${port}${base === '/' ? '' : base}/`;
export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120_000,
  expect: { timeout: 10_000 },
  fullyParallel: true,
  workers: process.env.CI ? 2 : 3,
  retries: 0,
  reporter: [['list'], ['json', { outputFile: 'reports/e2e-results.json' }]],
  use: {
    baseURL: BASE_URL,
    trace: 'off',
    screenshot: 'only-on-failure',
    launchOptions: { executablePath: process.env.CHROMIUM_PATH || undefined, args: ['--no-sandbox'] },
  },
  webServer: { command: 'node scripts/serve-dist.mjs', url: BASE_URL, reuseExistingServer: true, timeout: 30_000 },
});
