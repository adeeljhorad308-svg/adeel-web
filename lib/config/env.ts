import { z } from 'zod';

/**
 * Environment validation (Stage 5 §16).
 *
 * Parsed once at module load so misconfiguration fails fast at boot rather than
 * surfacing as a runtime error deep in a request. Server secrets and public
 * (NEXT_PUBLIC_*) values are validated in separate schemas so that only the
 * public subset is ever imported into client bundles.
 *
 * NOTE: this module deliberately does NOT import `server-only`, because
 * `middleware.ts` (which runs in the Edge runtime, not a Client or Server
 * Component bundle) imports `serverEnv` from here. Whether Next's bundler
 * would treat the Edge/middleware context as "client" for the `server-only`
 * sentinel's purposes cannot be verified without actually compiling, so this
 * file avoids that risk rather than guess. No Client Component currently
 * imports this module (verified) — that absence is the current safeguard.
 */

const nodeEnv = z.enum(['development', 'test', 'production']).default('development');

const booleanFromString = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');

const serverSchema = z.object({
  NODE_ENV: nodeEnv,

  // --- Database (Neon PostgreSQL) ---
  DATABASE_URL: z.string().url(),
  DIRECT_URL: z.string().url(),

  // --- Auth.js ---
  NEXTAUTH_URL: z.string().url(),
  NEXTAUTH_SECRET: z.string().min(32, 'NEXTAUTH_SECRET must be at least 32 characters'),

  // --- Cloudinary (media) ---
  CLOUDINARY_CLOUD_NAME: z.string().min(1),
  CLOUDINARY_API_KEY: z.string().min(1),
  CLOUDINARY_API_SECRET: z.string().min(1),

  // --- Resend (transactional email) ---
  RESEND_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().email(),

  // --- Upstash Redis (rate limiting, caching, locks) ---
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),

  // --- Trigger.dev (background jobs) ---
  TRIGGER_SECRET_KEY: z.string().min(1),
  TRIGGER_PROJECT_ID: z.string().min(1),

  // --- OpenTelemetry ---
  OTEL_EXPORTER_OTLP_ENDPOINT: z.string().url().optional(),
  OTEL_EXPORTER_OTLP_HEADERS: z.string().optional(),
  OTEL_SERVICE_NAME: z.string().default('adeel-it-platform'),

  // --- Operational flags ---
  MAINTENANCE_MODE: booleanFromString.default('false'),
});

const clientSchema = z.object({
  NEXT_PUBLIC_APP_URL: z.string().url(),
  NEXT_PUBLIC_DEFAULT_LOCALE: z.string().default('en'),
  // Analytics IDs are optional and consent-gated at render time.
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
    throw new Error(
      `Invalid server environment variables:\n${formatIssues(parsed.error)}\n` +
        'See .env.example for the required configuration.',
    );
  }
  return parsed.data;
}

function parseClientEnv(): z.infer<typeof clientSchema> {
  // Only NEXT_PUBLIC_* are inlined by Next at build time; reference explicitly so
  // the bundler can statically replace them.
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

/**
 * During `next build` on CI without a full secret set, we skip strict server
 * parsing to allow static analysis, but never in dev/production runtime.
 */
const shouldValidateServer =
  process.env.SKIP_ENV_VALIDATION !== 'true' && typeof window === 'undefined';

export const serverEnv: z.infer<typeof serverSchema> = shouldValidateServer
  ? parseServerEnv()
  : (process.env as unknown as z.infer<typeof serverSchema>);

export const clientEnv: z.infer<typeof clientSchema> = parseClientEnv();

export type ServerEnv = z.infer<typeof serverSchema>;
export type ClientEnv = z.infer<typeof clientSchema>;
