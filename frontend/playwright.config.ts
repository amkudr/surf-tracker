import { defineConfig, devices } from '@playwright/test';

const baseURL = process.env.BASE_URL ?? 'http://localhost:5173';
const useExternalServers = process.env.USE_EXTERNAL_SERVERS === 'true';
const isCI = !!process.env.CI;
const defaultDatabaseUrl = process.env.DATABASE_URL ?? 'postgresql+asyncpg://postgres:postgres@localhost:5432/surf_tracker';
const uvicornCommand = process.env.UVICORN_CMD ?? 'uvicorn';

const sharedEnv = {
  ...process.env,
  DATABASE_URL: defaultDatabaseUrl,
  SECRET_KEY: process.env.SECRET_KEY ?? 'dev-secret-key',
  CORS_ALLOWED_ORIGINS:
    process.env.CORS_ALLOWED_ORIGINS ?? '["http://localhost:4173","http://127.0.0.1:4173"]',
};

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 120_000,
  expect: {
    timeout: 10_000,
  },
  retries: isCI ? 1 : 0,
  workers: isCI ? 2 : undefined,
  reporter: [['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: {
    baseURL,
    trace: isCI ? 'on-first-retry' : 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    headless: true,
  },
  globalSetup: './tests/e2e/global-setup.ts',
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: useExternalServers
    ? []
    : [
        {
          command: `${uvicornCommand} app.main:app --host 0.0.0.0 --port 8000`,
          cwd: '..',
          env: sharedEnv,
          reuseExistingServer: !isCI,
          stdout: 'pipe',
          stderr: 'pipe',
          timeout: 120_000,
        },
        {
          command: 'npm run dev -- --host --port 5173',
          cwd: '.',
          env: {
            ...sharedEnv,
            VITE_API_PROXY_TARGET: process.env.VITE_API_PROXY_TARGET ?? 'http://localhost:8000',
          },
          reuseExistingServer: !isCI,
          stdout: 'pipe',
          stderr: 'pipe',
          timeout: 120_000,
        },
      ],
});
