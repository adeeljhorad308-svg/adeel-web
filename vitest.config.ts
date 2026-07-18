import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';

/** Unit test configuration. Integration tests use vitest.integration.config.ts. */
export default defineConfig({
  plugins: [react()],
  test: {
    // No current unit test touches the DOM; jsdom's global `URL`/`window`
    // shims break plain Node file-path resolution (e.g. `new URL(rel, import.meta.url)`
    // silently resolves against jsdom's fake origin instead of the file:// base).
    // Add a `// @vitest-environment jsdom` docblock to an individual test file
    // if/when a component test needs it.
    environment: 'node',
    globals: true,
    include: ['tests/unit/**/*.test.{ts,tsx}'],
    setupFiles: ['tests/setup.ts'],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('.', import.meta.url)),
      // The `server-only` package throws unconditionally unless the bundler
      // sets the "react-server" export condition (which Next.js's RSC
      // compiler does, but Vite/Vitest doesn't). Alias it to its no-op
      // sibling so server-only modules can be unit tested outside Next.js.
      'server-only': fileURLToPath(new URL('./node_modules/server-only/empty.js', import.meta.url)),
    },
  },
});
