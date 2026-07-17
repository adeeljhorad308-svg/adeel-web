import 'server-only';
import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';
import { serverEnv } from '@/lib/config/env';

/**
 * Upstash Redis (Stage 5 §12, §10) — rate limiting, caching, and distributed locks.
 *
 * A single REST client is shared. Rate limiters are declared per use-case with
 * distinct prefixes so counters never collide. Sliding-window is used for smooth
 * limiting without burst edges at window boundaries.
 */

export const redis = new Redis({
  url: serverEnv.UPSTASH_REDIS_REST_URL,
  token: serverEnv.UPSTASH_REDIS_REST_TOKEN,
});

/** Rate limiters keyed by concern. Tune limits per endpoint sensitivity. */
export const rateLimiters = {
  /** Authentication attempts — strict, per IP+identifier (brute-force defense). */
  auth: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '15 m'),
    prefix: 'rl:auth',
    analytics: false,
  }),
  /** Public form submissions (contact, newsletter). */
  publicForm: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(5, '10 m'),
    prefix: 'rl:form',
    analytics: false,
  }),
  /** Authenticated write actions — generous but bounded. */
  mutation: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(60, '1 m'),
    prefix: 'rl:mutation',
    analytics: false,
  }),
  /** Search queries. */
  search: new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '1 m'),
    prefix: 'rl:search',
    analytics: false,
  }),
} as const;

/**
 * Acquire a distributed lock (Stage 5 improvement). Returns a release function,
 * or null if the lock is already held. Prevents concurrent execution of the same
 * critical section across serverless instances (e.g. scheduled-publish sweeps).
 */
export async function acquireLock(
  key: string,
  ttlSeconds: number,
): Promise<(() => Promise<void>) | null> {
  const token = crypto.randomUUID();
  const acquired = await redis.set(`lock:${key}`, token, { nx: true, ex: ttlSeconds });
  if (acquired !== 'OK') return null;

  return async () => {
    // Release only if we still own the lock (compare-and-delete via Lua).
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end`;
    await redis.eval(script, [`lock:${key}`], [token]);
  };
}
