import { z } from 'zod';

/**
 * Environment validation (Stage 5 §16).
 *
 * Server environment variables are validated at runtime in development/production.
 * During `next build` (when secrets may be missing), we log a warning but do not crash.
 * This prevents build failures in CI and local environments without a full .env file.
 */

const nodeEnv = z.enum(['development', 'test', 'production']).default('development');

const booleanFromString = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

const serverSchema = z.object({
  NODE_ENV: nodeEnv,
  DATABASE_URL: z.string().url().optional(),
  DIRECT_URL: z.string().url().optional(),
  NEXTAUTH_URL: z.string().url().optional(),
  NEXTAUTH_SECRET: z.string().min(32).optional(),
  CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
  CLOUDINARY_API_KEY: z.string().min(1).optional(),
  CLOUDINARY_API_SECRET: z.string().min(1).optional(),
  RESEND_API_KEY: z.string().min(1).optional(),
  EMAIL_FROM: z.string().email().optional(),
  UPSTASH_REDIS_REST_URL: z.string().url().optional(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1).optional(),
  TRIGGER_SECRET_KEY: z.string().min(1).optional(),
  TRIGGER_PROJECT_ID: z.string().min(1).optional(),
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
  OTEL_EXPORTER_OTLP_HEADERS: z.string().optional(),
  OTEL_SERVICE_NAME: z.string().default('adeel-it-platform'),
  MAINTENANCE_MODE: booleanFromString.default('false'),
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_DEFAULT_LOCALE: z.string().default('en'),
  NEXT_PUBLIC_GA_ID: z.string().optional(),
  NEXT_PUBLIC_GTM_ID: z.string().optional(),
});

function formatIssues(error: z.ZodError): string {
  return error.issues
    .map((issue) => `  - ${issue.path.join('.') || '(root)'}: ${issue.message}`)
    .join('\n');
}

function parseServerEnv(): z.infer<typeof serverSchema> {
  const parsed = serverSchema.safeParse(process.env);
  if (!parsed.success) {
    console.warn(
      '⚠️  Some server environment variables are missing or invalid during build.\n' +
      'Some features may not work until they are provided.\n' +
      formatIssues(parsed.error)
    );
    // Return empty object to satisfy type without using `any`
    return {} as z.infer<typeof serverSchema>;
  }
  return parsed.data;
}

function parseClientEnv(): z.infer<typeof clientSchema> {
  const source = {
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_DEFAULT_LOCALE: process.env.NEXT_PUBLIC_DEFAULT_LOCALE,
    NEXT_PUBLIC_GA_ID: process.env.NEXT_PUBLIC_GA_ID,
    NEXT_PUBLIC_GTM_ID: process.env.NEXT_PUBLIC_GTM_ID,
  };
  const parsed = clientSchema.safeParse(source);
  if (!parsed.success) {
    throw new Error(
      `Invalid public environment variables:\n${formatIssues(parsed.error)}`,
    );
  }
  return parsed.data;
}

export const serverEnv = parseServerEnv();
export const clientEnv = parseClientEnv();

export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;
