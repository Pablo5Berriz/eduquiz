import { defineConfig, devices } from '@playwright/test';

const port = process.env.PLAYWRIGHT_PORT ?? '3000';
const baseURL = `http://localhost:${port}`;
const webServerCommand =
  process.platform === 'win32'
    ? `powershell -NoProfile -Command "Remove-Item Env:REDIS_URL -ErrorAction SilentlyContinue; pnpm exec next dev --hostname 127.0.0.1 --port ${port}"`
    : `env -u REDIS_URL pnpm exec next dev --hostname 127.0.0.1 --port ${port}`;

export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI
    ? [['github'], ['html', { open: 'never' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL,
    trace: 'on-first-retry',
  },
  webServer: {
    command: webServerCommand,
    env: {
      EDUQUIZ_E2E_ALLOW_RATE_LIMIT_BYPASS: '1',
    },
    url: `${baseURL}/fr`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'mobile-chromium',
      use: { ...devices['Pixel 5'] },
    },
  ],
});
