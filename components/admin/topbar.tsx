'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Menu, Sun, Moon, LogOut, ChevronDown } from 'lucide-react';
import { useTheme } from '@/components/providers/theme-provider';
import { NotificationBell } from '@/components/admin/notification-bell';
import { GlobalSearch } from '@/components/admin/global-search';
import { logout } from '@/lib/services/auth-actions';
import type { Role } from '@/lib/constants';

/**
 * Admin topbar (Stage 4 §1). Hosts the mobile menu toggle, theme switch, and the
 * user menu (name, role, sign out). Keeps interaction light; global search (⌘K)
 * mounts here in Phase 5. Sign-out calls the logout action then routes to login.
 */

export interface AdminTopbarProps {
  readonly userName: string;
  readonly userRole: Role;
  readonly onMenuToggle: () => void;
}

const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  ADMIN: 'Admin',
  DEVELOPER: 'Developer',
  SALES: 'Sales',
  ACCOUNTS: 'Accounts',
  MARKETING: 'Marketing',
  CONTENT_EDITOR: 'Content Editor',
  SUPPORT: 'Support',
  VIEWER: 'Viewer',
};

export function AdminTopbar({
  userName,
  userRole,
  onMenuToggle,
}: AdminTopbarProps): React.ReactElement {
  const router = useRouter();
  const { resolved, setMode } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);

  async function handleLogout(): Promise<void> {
    await logout();
    router.push('/login');
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-sticky flex h-16 items-center justify-between border-b border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] px-4">
      <button
        onClick={onMenuToggle}
        className="rounded-md p-2 text-[color:var(--color-text-body)] hover:bg-[color:var(--color-bg-subtle)] lg:hidden"
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" aria-hidden="true" />
      </button>

      <div className="hidden sm:block">
        <GlobalSearch />
      </div>

      <div className="ml-auto flex items-center gap-2">
        <button
          onClick={() => setMode(resolved === 'dark' ? 'light' : 'dark')}
          className="rounded-md p-2 text-[color:var(--color-text-body)] hover:bg-[color:var(--color-bg-subtle)]"
          aria-label={resolved === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
        >
          {resolved === 'dark' ? (
            <Sun className="h-5 w-5" aria-hidden="true" />
          ) : (
            <Moon className="h-5 w-5" aria-hidden="true" />
          )}
        </button>

        <NotificationBell />

        <div className="relative">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-haspopup="menu"
            className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-[color:var(--color-bg-subtle)]"
          >
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--color-brand-tint)] text-small font-semibold text-[color:var(--color-brand-primary)]">
              {userName.charAt(0).toUpperCase()}
            </span>
            <span className="hidden text-left sm:block">
              <span className="block text-small font-semibold leading-tight text-[color:var(--color-text-primary)]">
                {userName}
              </span>
              <span className="block text-overline text-[color:var(--color-text-muted)]">
                {ROLE_LABELS[userRole]}
              </span>
            </span>
            <ChevronDown
              className="h-4 w-4 text-[color:var(--color-text-muted)]"
              aria-hidden="true"
            />
          </button>

          {menuOpen && (
            <div
              role="menu"
              className="absolute right-0 mt-1 w-48 rounded-md border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] p-1 shadow-lg"
            >
              <button
                role="menuitem"
                onClick={() => void handleLogout()}
                className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-left text-small text-[color:var(--color-text-body)] hover:bg-[color:var(--color-bg-subtle)]"
              >
                <LogOut className="h-4 w-4" aria-hidden="true" />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
