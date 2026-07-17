import 'server-only';
import pino, { type Logger } from 'pino';
import { serverEnv } from '@/lib/config/env';

/**
 * Structured application logger (Stage 5 §13).
 *
 * - JSON output in production for ingestion by the log platform.
 * - Pretty, human-readable output in development.
 * - Secret redaction so credentials never reach logs (OWASP: sensitive data).
 *
 * This is the low-level app logger. Business/security audit events are recorded
 * separately and durably via the activity log (lib/logging/activity.ts).
 */

const redactPaths = [
  'password',
  'passwordHash',
  'token',
  'secret',
  'authorization',
  '*.password',
  '*.passwordHash',
  '*.token',
  '*.secret',
  'req.headers.authorization',
  'req.headers.cookie',
];

const isProduction = serverEnv.NODE_ENV === 'production';

export const logger: Logger = pino({
  level: isProduction ? 'info' : 'debug',
  redact: { paths: redactPaths, censor: '[redacted]' },
  base: { service: serverEnv.OTEL_SERVICE_NAME },
  timestamp: pino.stdTimeFunctions.isoTime,
  ...(isProduction
    ? {}
    : {
        transport: {
          target: 'pino/file',
          options: { destination: 1 },
        },
      }),
});

/** Create a child logger bound to a request or job correlation id. */
export function withContext(context: Record<string, unknown>): Logger {
  return logger.child(context);
}
