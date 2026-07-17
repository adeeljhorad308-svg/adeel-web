import { defineConfig } from '@trigger.dev/sdk/v3';
import { serverEnv } from './lib/config/env';

/**
 * Trigger.dev configuration (Stage 5 improvement).
 *
 * Background jobs handle all long-running / async work so requests stay fast:
 * transactional email, notifications, backups, scheduled publishing, exports, and
 * image optimization. Task definitions live under /trigger and are registered by
 * directory. Retries are conservative defaults; individual tasks can override.
 */
export default defineConfig({
  project: serverEnv.TRIGGER_PROJECT_ID,
  dirs: ['./trigger'],
  maxDuration: 300,
  retries: {
    enabledInDev: false,
    default: {
      maxAttempts: 3,
      minTimeoutInMs: 1000,
      maxTimeoutInMs: 10000,
      factor: 2,
      randomize: true,
    },
  },
});
