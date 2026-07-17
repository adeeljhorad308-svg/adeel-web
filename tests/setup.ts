import '@testing-library/jest-dom/vitest';

/**
 * Global test setup. Provides safe default environment variables so modules that
 * validate env at import time can load under test without real secrets.
 */
process.env.SKIP_ENV_VALIDATION = 'true';
process.env.NEXT_PUBLIC_APP_URL ??= 'http://localhost:3000';
process.env.NEXT_PUBLIC_DEFAULT_LOCALE ??= 'en';
