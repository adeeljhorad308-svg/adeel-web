import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { redis } from '@/lib/cache/redis';

/**
 * Feature flag system (Stage 5 improvement).
 *
 * Flags gate future modules so they can be enabled/disabled without a deploy.
 * Values are read-through cached in Redis (short TTL) to avoid a DB hit on every
 * check while still reflecting admin toggles quickly. Unknown flags default to
 * disabled — fail-closed for unbuilt functionality.
 */

const CACHE_TTL_SECONDS = 30;
const cacheKey = (key: string): string => `ff:${key}`;

/** Canonical flag keys. Extend as future modules are introduced. */
export const FEATURE_FLAGS = {
  BILLING: 'module.billing',
  CLIENT_PORTAL: 'module.client_portal',
  EMPLOYEE_PORTAL: 'module.employee_portal',
  AI_CHATBOT: 'module.ai_chatbot',
  SUPPORT_TICKETS: 'module.support_tickets',
  BOOKING: 'module.booking',
} as const;

export type FeatureFlagKey = (typeof FEATURE_FLAGS)[keyof typeof FEATURE_FLAGS];

export async function isFeatureEnabled(key: string): Promise<boolean> {
  const cached = await redis.get<string>(cacheKey(key));
  if (cached !== null && cached !== undefined) {
    return cached === '1';
  }

  const flag = await prisma.featureFlag.findUnique({ where: { key } });
  const enabled = flag?.enabled ?? false;
  await redis.set(cacheKey(key), enabled ? '1' : '0', { ex: CACHE_TTL_SECONDS });
  return enabled;
}

/** Set a flag and invalidate its cache. Intended for the admin Settings surface. */
export async function setFeatureFlag(
  key: string,
  enabled: boolean,
  description?: string,
): Promise<void> {
  await prisma.featureFlag.upsert({
    where: { key },
    create: { key, enabled, description: description ?? null },
    update: { enabled, ...(description !== undefined ? { description } : {}) },
  });
  await redis.set(cacheKey(key), enabled ? '1' : '0', { ex: CACHE_TTL_SECONDS });
}
