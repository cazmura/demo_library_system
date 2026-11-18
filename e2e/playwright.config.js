import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:3001',
    trace: 'retain-on-failure',
  },
  webServer: {
    command: 'node ../backend/src/server.js',
    url: 'http://localhost:3001/api/health',
    cwd: import.meta.dirname,
    reuseExistingServer: !process.env.CI,
    env: {
      DB_PATH: ':memory:',
      PORT: '3001',
    },
  },
});
