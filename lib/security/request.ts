import 'server-only';
import { headers } from 'next/headers';
import { rateLimiters } from '@/lib/cache/redis';
import { RateLimitError, ForbiddenError } from '@/lib/errors';
import { clientEnv } from '@/lib/config/env';

/**
 * Request-scoped security helpers used by Server Actions and Route Handlers.
 */

/**
 * Best-effort client IP from proxy headers. On Vercel/Cloudflare the leftmost
 * X-Forwarded-For entry is the client. Falls back to a stable sentinel so rate
 * limiting still functions (all unknowns share a bucket) rather than failing open.
 */
export async function getClientIp(): Promise<string> {
  const h = await headers();
  const forwarded = h.get('x-forwarded-for');
  if (forwarded) {
    const first = forwarded.split(',')[0]?.trim();
    if (first) return first;
  }
  return h.get('x-real-ip')?.trim() ?? 'unknown';
}

/**
 * Enforce a rate limit for the given limiter + key. Throws RateLimitError (429)
 * when exceeded. Keys should be scoped, e.g. `auth:${ip}:${email}`.
 */
export async function enforceRateLimit(
  limiter: keyof typeof rateLimiters,
  key: string,
): Promise<void> {
  const { success } = await rateLimiters[limiter].limit(key);
  if (!success) {
    throw new RateLimitError();
  }
}

/**
 * CSRF defense for Route Handlers (build-readiness fix; OWASP: CSRF).
 *
 * Server Actions get automatic same-origin enforcement from Next.js itself;
 * plain Route Handlers do not. Any mutating Route Handler (POST/PUT/PATCH/
 * DELETE) that relies on the session cookie for auth must call this before
 * doing any work, since a cross-site form/fetch could otherwise ride the
 * victim's cookie to this endpoint. Compares the request's Origin header
 * against the configured app URL; throws ForbiddenError on mismatch or if the
 * header is missing (browsers always send Origin on cross-origin and same-
 * origin state-changing requests in modern fetch/XHR).
 */
export async function enforceSameOrigin(): Promise<void> {
  const h = await headers();
  const origin = h.get('origin');

  if (!origin || new URL(origin).origin !== new URL(clientEnv.NEXT_PUBLIC_APP_URL).origin) {
    throw new ForbiddenError('Cross-origin request rejected.');
  }
}
