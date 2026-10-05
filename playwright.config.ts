import { defineConfig, devices } from '@playwright/test';

/**
 * 5 parcours clés (section 4 de la spécification).
 * En local (conteneur), Chromium préinstallé : PW_CHROMIUM=/opt/pw-browsers/chromium.
 * En CI, `npx playwright install chromium` fournit le navigateur.
 */
export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: 0,
  reporter: [['list']],
  use: {
    baseURL: 'http://localhost:4321',
    ...devices['Desktop Chrome'],
    launchOptions: process.env.PW_CHROMIUM ? { executablePath: process.env.PW_CHROMIUM } : {},
  },
  webServer: {
    command: 'pnpm preview --port 4321',
    url: 'http://localhost:4321',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
