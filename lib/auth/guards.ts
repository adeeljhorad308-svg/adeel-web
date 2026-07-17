import 'server-only';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth/config';
import { can } from '@/lib/auth/authorization';
import { ForbiddenError, UnauthenticatedError } from '@/lib/errors';
import type { Action, Module } from '@/lib/constants';
import type { AuthenticatedUser } from '@/lib/types';

/**
 * Authorization guards (Stage 5 §7–§8). These are the single enforcement point
 * every Server Action and protected Route Handler calls. Authorization is ALWAYS
 * checked here on the server; the UI hiding unauthorized controls is convenience,
 * never the security boundary.
 *
 * Two families:
 *   - require* throw typed errors (for Server Actions / Route Handlers, which
 *     convert them to the response envelope).
 *   - *OrRedirect variants send unauthenticated users to /login and forbidden
 *     users to /403 (for Server Components / pages).
 */

/** Resolve the current authenticated user, or null. */
export async function getCurrentUser(): Promise<AuthenticatedUser | null> {
  const session = await auth();
  if (!session?.user?.id) return null;
  // Suspended accounts are treated as unauthenticated for access purposes.
  if (session.user.status === 'SUSPENDED') return null;
  return {
    id: session.user.id,
    email: session.user.email ?? '',
    name: session.user.name ?? null,
    role: session.user.role,
  };
}

/** Require an authenticated user; throw UnauthenticatedError otherwise. */
export async function requireUser(): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) throw new UnauthenticatedError();
  return user;
}

/** Require a specific permission; throw on missing auth or permission. */
export async function requirePermission(
  moduleKey: Module,
  action: Action,
): Promise<AuthenticatedUser> {
  const user = await requireUser();
  const allowed = await can(user.role, moduleKey, action);
  if (!allowed) throw new ForbiddenError();
  return user;
}

/** Page-level: redirect to login (preserving return path) if unauthenticated. */
export async function requireUserOrRedirect(callbackPath?: string): Promise<AuthenticatedUser> {
  const user = await getCurrentUser();
  if (!user) {
    const target = callbackPath
      ? `/login?callbackUrl=${encodeURIComponent(callbackPath)}`
      : '/login';
    redirect(target);
  }
  return user;
}

/** Page-level: redirect to /login or /403 based on what's missing. */
export async function requirePermissionOrRedirect(
  moduleKey: Module,
  action: Action,
  callbackPath?: string,
): Promise<AuthenticatedUser> {
  const user = await requireUserOrRedirect(callbackPath);
  const allowed = await can(user.role, moduleKey, action);
  if (!allowed) redirect('/403');
  return user;
}
