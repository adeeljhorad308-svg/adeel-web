import { describe, expect, it } from 'vitest';
import { defaultPermissionRows, hasDefaultPermission } from '@/lib/auth/permissions';

/**
 * RBAC matrix tests (Stage 5 §21: explicit role-permission tests). These lock in
 * the approved Stage 4 §18 matrix so accidental permission regressions fail CI.
 */
describe('RBAC default permissions', () => {
  it('grants Super Admin full control of Users', () => {
    expect(hasDefaultPermission('SUPER_ADMIN', 'USERS', 'DELETE')).toBe(true);
  });

  it('does not let Admin delete Users (limited grant)', () => {
    expect(hasDefaultPermission('ADMIN', 'USERS', 'DELETE')).toBe(false);
    expect(hasDefaultPermission('ADMIN', 'USERS', 'EDIT')).toBe(true);
  });

  it('restricts Viewer to read-only', () => {
    expect(hasDefaultPermission('VIEWER', 'PORTFOLIO', 'VIEW')).toBe(true);
    expect(hasDefaultPermission('VIEWER', 'PORTFOLIO', 'EDIT')).toBe(false);
  });

  it('denies Sales access to Theme', () => {
    expect(hasDefaultPermission('SALES', 'THEME', 'VIEW')).toBe(false);
  });

  it('reserves Theme and Navigation for Admin and Super Admin only', () => {
    for (const role of ['DEVELOPER', 'SALES', 'MARKETING', 'CONTENT_EDITOR', 'VIEWER'] as const) {
      expect(hasDefaultPermission(role, 'THEME', 'VIEW')).toBe(false);
      expect(hasDefaultPermission(role, 'NAVIGATION', 'VIEW')).toBe(false);
    }
  });

  it('produces a non-empty, well-formed set of seed rows', () => {
    const rows = defaultPermissionRows();
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) {
      expect(row.allowed).toBe(true);
      expect(row.role).toBeTruthy();
      expect(row.module).toBeTruthy();
      expect(row.action).toBeTruthy();
    }
  });
});
