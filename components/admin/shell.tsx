'use client';

import { useState } from 'react';
import { AdminSidebar } from './sidebar';
import { AdminTopbar } from './topbar';
import type { AdminNavGroup } from '@/lib/config/admin-nav';
import type { Role } from '@/lib/constants';

/**
 * Admin shell (Stage 4 §1). Client wrapper owning the mobile-drawer open state and
 * composing the permission-filtered sidebar (from the server) with the topbar. The
 * content region is where each module's page renders; it uses full width (admin is
 * data-dense, unlike the width-capped public site).
 */
export function AdminShell({
  nav,
  userName,
  userRole,
  children,
}: {
  nav: readonly AdminNavGroup[];
  userName: string;
  userRole: Role;
  children: React.ReactNode;
}): React.ReactElement {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-[color:var(--color-bg-page)]">
      <AdminSidebar nav={nav} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar
          userName={userName}
          userRole={userRole}
          onMenuToggle={() => setMobileOpen((v) => !v)}
        />
        <main id="main-content" className="flex-1 p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
