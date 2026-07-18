'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as Icons from 'lucide-react';
import { cn } from '@/lib/utils';
import { APP_NAME } from '@/lib/constants';
import type { AdminNavGroup } from '@/lib/config/admin-nav';

/**
 * Admin sidebar (Stage 4 §1). Receives the already-permission-filtered nav from
 * the server so it never renders links the viewer can't access. Persistent rail at
 * ≥lg; an overlay drawer below lg toggled from the topbar. Active item uses
 * aria-current. Icons resolve by name from lucide-react.
 */

function Icon({ name, className }: { name: string; className?: string }): React.ReactElement {
  const Cmp = (Icons as unknown as Record<string, Icons.LucideIcon>)[name] ?? Icons.Circle;
  return <Cmp className={className} aria-hidden="true" />;
}

export interface AdminSidebarProps {
  readonly nav: readonly AdminNavGroup[];
  readonly mobileOpen: boolean;
  readonly onClose: () => void;
}

export function AdminSidebar({ nav, mobileOpen, onClose }: AdminSidebarProps): React.ReactElement {
  const pathname = usePathname();

  const content = (
    <nav aria-label="Admin" className="flex h-full flex-col gap-6 overflow-y-auto p-4">
      <Link
        href="/admin"
        className="px-2 py-1 font-display text-h4 font-bold text-[color:var(--color-text-primary)]"
      >
        {APP_NAME.split(' ')[0]}
        <span className="text-[color:var(--color-brand-primary)]">.</span>
      </Link>
      {nav.map((group) => (
        <div key={group.label} className="flex flex-col gap-1">
          <p className="px-2 text-overline font-semibold uppercase text-[color:var(--color-text-muted)]">
            {group.label}
          </p>
          {group.items.map((item) => {
            const active =
              pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex items-center gap-3 rounded-md px-2 py-2 text-small font-medium transition-colors duration-fast ease-out',
                  active
                    ? 'bg-[color:var(--color-brand-tint)] text-[color:var(--color-brand-primary)]'
                    : 'text-[color:var(--color-text-body)] hover:bg-[color:var(--color-bg-subtle)]',
                )}
              >
                <Icon name={item.icon} className="h-4 w-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );

  return (
    <>
      {/* Persistent rail (lg and up). */}
      <aside className="hidden w-64 shrink-0 border-r border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] lg:block">
        {content}
      </aside>

      {/* Mobile drawer. */}
      {mobileOpen && (
        <div className="fixed inset-0 z-modal lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
          <div className="absolute left-0 top-0 h-full w-64 border-r border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)]">
            {content}
          </div>
        </div>
      )}
    </>
  );
}
