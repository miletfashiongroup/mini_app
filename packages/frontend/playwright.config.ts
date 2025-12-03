import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

import { defineConfig } from '@playwright/test';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  webServer: {
    command: 'pnpm dev -- --host --port 4173',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    cwd: __dirname,
  },
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:4173',
    trace: 'retain-on-failure',
  },
  testDir: 'e2e',
});
