import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  // The tests run against the production build in public/, so run "npm run build" first
  webServer: { command: 'npx vite preview --port 4173 --strictPort', url: 'http://localhost:4173', reuseExistingServer: true },
  use: { baseURL: 'http://localhost:4173', serviceWorkers: 'block' },
  projects: [
    { name: 'desktop', testIgnore: 'phone.spec.ts' },
    { name: 'phone', testMatch: 'phone.spec.ts', use: { ...devices['Pixel 7'] } },
  ],
});
