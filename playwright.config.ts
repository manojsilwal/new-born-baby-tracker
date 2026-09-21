import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests/e2e',
  testMatch: '**/*.spec.ts',
  timeout: 30000,
  retries: 0,
  workers: 1,
  reporter: [['list']],
  use: {
    baseURL: process.env.MOCK_SERVER_URL || 'http://127.0.0.1:54321',
    extraHTTPHeaders: {
      'Content-Type': 'application/json',
    },
  },
});
