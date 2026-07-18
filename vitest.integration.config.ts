import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

/**
 * Integration test configuration. Runs against a disposable Postgres test
 * database (Stage 5 §21); requires TEST_DATABASE_URL to be set in CI.
 */
export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/integration/**/*.test.ts'],
    setupFiles: ['tests/setup.ts'],
    testTimeout: 20000,
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
      'server-only': fileURLToPath(new URL('./node_modules/server-only/empty.js', import.meta.url)),
    },
  },
});
