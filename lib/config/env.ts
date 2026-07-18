import { z } from 'zod';

/**
 * Environment validation (Stage 5 §16).
 *
 * Server environment variables are validated at runtime in development/production.
 * During `next build` (when secrets may be missing), we log a warning but do not crash.
 * This prevents build failures in CI and local environments without a full .env file.
 */

const nodeEnv = z.enum(['development', 'test', 'production']).default('development');

const booleanFromString = z.enum(['true', 'false']).transform((value) => value === 'true');

// `.env` files conventionally represent "unset" as an empty string, but Zod's
// `.optional()` only treats `undefined` as absent — an empty string fails
// validators like `.url()`/`.email()`. Normalize "" to undefined first so an
// unset optional var is treated as unset rather than as invalid input.
const emptyToUndefined = z.literal('').transform(() => undefined);

function optionalString<Schema extends z.ZodTypeAny>(schema: Schema) {
  // Falls back to undefined (rather than failing the whole env object) if the
  // value is present but invalid — see parseServerEnv below for why a single
  // bad var must never wipe out every other field's value/default.
  return z.union([emptyToUndefined, schema]).optional().catch(undefined);
}

// Resend (and RFC 5322 generally) accept a plain address or a display name
// wrapping one, e.g. `Name <user@example.com>` — the format our own
// .env.example recommends. A bare `.email()` check rejects the latter.
const emailAddress = z.string().refine((value) => {
  const match = /^(.*)<(.+)>$/.exec(value);
  const address = match ? match[2] : value;
  return z.string().email().safeParse(address?.trim()).success;
}, 'Invalid email');

const serverSchema = z.object({
  NODE_ENV: nodeEnv,
  DATABASE_URL: optionalString(z.string().url()),
  DIRECT_URL: optionalString(z.string().url()),
  NEXTAUTH_URL: optionalString(z.string().url()),
  NEXTAUTH_SECRET: optionalString(z.string().min(32)),
  CLOUDINARY_CLOUD_NAME: optionalString(z.string().min(1)),
  CLOUDINARY_API_KEY: optionalString(z.string().min(1)),
  CLOUDINARY_API_SECRET: optionalString(z.string().min(1)),
  RESEND_API_KEY: optionalString(z.string().min(1)),
  EMAIL_FROM: optionalString(emailAddress),
  UPSTASH_REDIS_REST_URL: optionalString(z.string().url()),
  UPSTASH_REDIS_REST_TOKEN: optionalString(z.string().min(1)),
  TRIGGER_SECRET_KEY: optionalString(z.string().min(1)),
  TRIGGER_PROJECT_ID: optionalString(z.string().min(1)),
  OTEL_EXPORTER_OTLP_ENDPOINT: optionalString(z.string().url()),
  OTEL_EXPORTER_OTLP_HEADERS: optionalString(z.string()),
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
        formatIssues(parsed.error),
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
    throw new Error(`Invalid public environment variables:\n${formatIssues(parsed.error)}`);
  }
  return parsed.data;
}

export const serverEnv = parseServerEnv();
export const clientEnv = parseClientEnv();

export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;
