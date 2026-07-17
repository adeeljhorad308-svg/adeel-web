import { requireUserOrRedirect } from '@/lib/auth/guards';
import { can } from '@/lib/auth/authorization';
import { ADMIN_NAV, type AdminNavGroup } from '@/lib/config/admin-nav';
import { AdminShell } from '@/components/admin/shell';

/**
 * Admin layout (Stage 4 §1, Stage 5 §7–§8). The security boundary for the entire
 * dashboard: it requires an authenticated, non-suspended user (redirecting to
 * login otherwise) and builds the navigation filtered to only the modules the
 * user has VIEW permission on. Middleware provides a fast first gate; this is the
 * authoritative server-side check.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const user = await requireUserOrRedirect('/admin');

  // Filter nav groups/items to those the user may view. Empty groups drop out.
  const filteredNav: AdminNavGroup[] = [];
  for (const group of ADMIN_NAV) {
    const items = [];
    for (const item of group.items) {
      if (await can(user.role, item.module, 'VIEW')) {
        items.push(item);
      }
    }
    if (items.length > 0) {
      filteredNav.push({ label: group.label, items });
    }
  }

  return (
    <AdminShell nav={filteredNav} userName={user.name ?? user.email} userRole={user.role}>
      {children}
    </AdminShell>
  );
}
