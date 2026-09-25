import { defineConfig } from '@playwright/test'

const repoRoot = new URL('..', import.meta.url).pathname
const pythonDir = `${repoRoot}/backend-python`
const pythonBin = `${pythonDir}/.venv/bin`
const databaseUrl =
  'postgresql+asyncpg://postgres:postgres@localhost:5432/taskboard_e2e'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'retain-on-failure',
  },
  globalSetup: './e2e/global-setup.js',
  globalTeardown: './e2e/global-teardown.js',
  webServer: [
    {
      command: `${pythonBin}/uvicorn main:app --host 127.0.0.1 --port 8000`,
      cwd: pythonDir,
      url: 'http://127.0.0.1:8000/health',
      reuseExistingServer: false,
      timeout: 120_000,
      env: {
        DATABASE_URL: databaseUrl,
        FRONTEND_ORIGIN: 'http://localhost:5173',
      },
    },
    {
      command: 'npm run dev -- --host 127.0.0.1 --port 5173',
      cwd: new URL('.', import.meta.url).pathname,
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: false,
      timeout: 120_000,
    },
  ],
})
