import 'server-only';
import pino, { type Logger } from 'pino';
import { serverEnv } from '@/lib/config/env';

/**
 * Structured application logger (Stage 5 §13).
 *
 * - JSON output to stdout in every environment.
 * - Secret redaction so credentials never reach logs (OWASP: sensitive data).
 *
 * This is the low-level app logger. Business/security audit events are recorded
 * separately and durably via the activity log (lib/logging/activity.ts).
 *
 * Deliberately no `transport` option: pino's transports spawn a worker thread
 * that resolves its target module (e.g. `pino/file`) from disk at runtime.
 * Next.js's webpack bundling breaks that resolution inside `.next/server`,
 * so the worker thread fails to start and every log call throws — this isn't
 * a corner case, it fires on the very first `logger.info`/`logger.error`
 * call and takes down the request. Plain synchronous pino output avoids the
 * worker thread entirely and is the config Next.js's own docs recommend.
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
});

/** Create a child logger bound to a request or job correlation id. */
export function withContext(context: Record<string, unknown>): Logger {
  return logger.child(context);
}
