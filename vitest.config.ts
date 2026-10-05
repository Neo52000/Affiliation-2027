import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Les specs Playwright (e2e/) ont leur propre runner : pnpm test:e2e.
    include: ['src/**/*.test.ts', 'scripts/**/*.test.ts'],
  },
});
