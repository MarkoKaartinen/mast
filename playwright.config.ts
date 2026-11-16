import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  // The tests run against the production build in public/, so run "npm run build" first
  webServer: { command: 'npx vite preview --port 4173 --strictPort', url: 'http://localhost:4173', reuseExistingServer: true },
  use: { baseURL: 'http://localhost:4173', serviceWorkers: 'block' },
});
