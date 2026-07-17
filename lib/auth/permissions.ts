import 'server-only';
import type { Action, Module, Role } from '@/lib/constants';

/**
 * RBAC default permission matrix (Stage 4 §18, Stage 5 §8).
 *
 * This is the seeded default. The RolePermission table can override any cell at
 * runtime (Super Admin only); `can()` resolves override-or-default. Authorization
 * is always enforced server-side — the frontend only hides what a role can't use.
 *
 * Grant levels expand to concrete actions:
 *   FULL  → VIEW, CREATE, EDIT, DELETE
 *   EDIT  → VIEW, CREATE, EDIT
 *   READ  → VIEW
 *   NONE  → (nothing)
 * LIMITED grants are expressed explicitly per module where they differ.
 */

type Grant = 'FULL' | 'EDIT' | 'READ' | 'NONE';

const GRANT_ACTIONS: Record<Grant, readonly Action[]> = {
  FULL: ['VIEW', 'CREATE', 'EDIT', 'DELETE'],
  EDIT: ['VIEW', 'CREATE', 'EDIT'],
  READ: ['VIEW'],
  NONE: [],
};

/**
 * Default grant per role × module. Derived directly from the approved Stage 4
 * matrix. Notifications are "scoped" (VIEW of the role's own notifications) and
 * modeled as READ here; scoping by target happens in the notification query.
 */
const MATRIX: Record<Role, Partial<Record<Module, Grant>>> = {
  SUPER_ADMIN: {
    DASHBOARD: 'FULL', PORTFOLIO: 'FULL', SERVICES: 'FULL', INDUSTRIES: 'FULL',
    TEAM: 'FULL', TESTIMONIALS: 'FULL', BLOG: 'FULL', CONTACTS: 'FULL', CRM: 'FULL',
    MEDIA: 'FULL', THEME: 'FULL', NAVIGATION: 'FULL', FOOTER: 'FULL', SEO: 'FULL',
    USERS: 'FULL', NOTIFICATIONS: 'FULL', SETTINGS: 'FULL', ACTIVITY: 'FULL', SEARCH: 'FULL',
  },
  ADMIN: {
    DASHBOARD: 'FULL', PORTFOLIO: 'FULL', SERVICES: 'FULL', INDUSTRIES: 'FULL',
    TEAM: 'FULL', TESTIMONIALS: 'FULL', BLOG: 'FULL', CONTACTS: 'FULL', CRM: 'FULL',
    MEDIA: 'FULL', THEME: 'FULL', NAVIGATION: 'FULL', FOOTER: 'FULL', SEO: 'FULL',
    USERS: 'EDIT', NOTIFICATIONS: 'FULL', SETTINGS: 'EDIT', ACTIVITY: 'FULL', SEARCH: 'FULL',
  },
  DEVELOPER: {
    DASHBOARD: 'READ', PORTFOLIO: 'FULL', SERVICES: 'EDIT', MEDIA: 'EDIT',
    NOTIFICATIONS: 'READ', SETTINGS: 'READ', SEARCH: 'READ',
  },
  SALES: {
    DASHBOARD: 'READ', CONTACTS: 'FULL', CRM: 'FULL', NOTIFICATIONS: 'READ', SEARCH: 'READ',
  },
  ACCOUNTS: {
    DASHBOARD: 'READ', CRM: 'READ', NOTIFICATIONS: 'READ', SEARCH: 'READ',
  },
  MARKETING: {
    DASHBOARD: 'READ', PORTFOLIO: 'EDIT', SERVICES: 'EDIT', TEAM: 'EDIT',
    TESTIMONIALS: 'FULL', BLOG: 'FULL', CONTACTS: 'READ', MEDIA: 'EDIT',
    FOOTER: 'EDIT', SEO: 'FULL', NOTIFICATIONS: 'READ', SEARCH: 'READ',
  },
  CONTENT_EDITOR: {
    DASHBOARD: 'READ', PORTFOLIO: 'EDIT', SERVICES: 'EDIT', TEAM: 'EDIT',
    TESTIMONIALS: 'EDIT', BLOG: 'EDIT', MEDIA: 'EDIT', SEO: 'EDIT',
    NOTIFICATIONS: 'READ', SEARCH: 'READ',
  },
  SUPPORT: {
    DASHBOARD: 'READ', CONTACTS: 'FULL', NOTIFICATIONS: 'READ', SEARCH: 'READ',
  },
  VIEWER: {
    DASHBOARD: 'READ', PORTFOLIO: 'READ', SERVICES: 'READ', TEAM: 'READ',
    TESTIMONIALS: 'READ', BLOG: 'READ', CONTACTS: 'READ', MEDIA: 'READ',
    SEO: 'READ', SEARCH: 'READ',
  },
};

/** Flattened default permission set, suitable for seeding RolePermission rows. */
export function defaultPermissionRows(): Array<{
  role: Role;
  module: Module;
  action: Action;
  allowed: boolean;
}> {
  const rows: Array<{ role: Role; module: Module; action: Action; allowed: boolean }> = [];
  for (const role of Object.keys(MATRIX) as Role[]) {
    const modules = MATRIX[role];
    for (const moduleKey of Object.keys(modules) as Module[]) {
      const grant = modules[moduleKey];
      if (!grant) continue;
      for (const action of GRANT_ACTIONS[grant]) {
        rows.push({ role, module: moduleKey, action, allowed: true });
      }
    }
  }
  return rows;
}

/** Resolve a permission from the in-memory default matrix (before DB overrides). */
export function hasDefaultPermission(role: Role, moduleKey: Module, action: Action): boolean {
  const grant = MATRIX[role][moduleKey] ?? 'NONE';
  return GRANT_ACTIONS[grant].includes(action);
}
