import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { redis } from '@/lib/cache/redis';
import { hasDefaultPermission } from '@/lib/auth/permissions';
import type { Action, Module, Role } from '@/lib/constants';

/**
 * Permission resolution (Stage 5 §8).
 *
 * `can()` answers "may this role perform this action on this module?" by checking
 * the RolePermission override table first, falling back to the seeded default
 * matrix when no override exists. Overrides are read-through cached in Redis with
 * a short TTL so the hot authorization path avoids a DB hit on every check while
 * still reflecting Super Admin changes quickly.
 *
 * SUPER_ADMIN is unconditionally allowed — it is the root role and cannot be
 * locked out of anything by an override (prevents accidental self-lockout).
 */

const OVERRIDE_TTL_SECONDS = 30;
const overrideKey = (role: Role, moduleKey: Module, action: Action): string =>
  `perm:${role}:${moduleKey}:${action}`;

async function resolveOverride(
  role: Role,
  moduleKey: Module,
  action: Action,
): Promise<boolean | null> {
  const cacheKey = overrideKey(role, moduleKey, action);
  const cached = await redis.get<string>(cacheKey);
  if (cached === '1') return true;
  if (cached === '0') return false;
  if (cached === 'none') return null;

  const row = await prisma.rolePermission.findUnique({
    where: { role_module_action: { role, module: moduleKey, action } },
    select: { allowed: true },
  });

  const value = row ? (row.allowed ? '1' : '0') : 'none';
  await redis.set(cacheKey, value, { ex: OVERRIDE_TTL_SECONDS });
  return row ? row.allowed : null;
}

/** Resolve a permission: DB override wins, else the default matrix. */
export async function can(role: Role, moduleKey: Module, action: Action): Promise<boolean> {
  if (role === 'SUPER_ADMIN') return true;
  const override = await resolveOverride(role, moduleKey, action);
  if (override !== null) return override;
  return hasDefaultPermission(role, moduleKey, action);
}

/** Invalidate cached overrides for a role (call after editing the matrix). */
export async function invalidatePermissionCache(role: Role): Promise<void> {
  // Redis pattern scan is avoided on the hot path; TTL (30s) bounds staleness,
  // but explicit invalidation keeps changes near-instant for the affected role.
  const keys: string[] = [];
  const modules = (await import('@/lib/constants')).MODULES;
  const actions = (await import('@/lib/constants')).ACTIONS;
  for (const m of modules) {
    for (const a of actions) {
      keys.push(overrideKey(role, m, a));
    }
  }
  if (keys.length > 0) {
    await redis.del(...keys);
  }
}
