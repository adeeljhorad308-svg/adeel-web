import type { Metadata } from 'next';
import { requirePermissionOrRedirect } from '@/lib/auth/guards';
import { listNotifications } from '@/lib/actions/notification-actions';
import { PageHeader, EmptyState } from '@/components/admin/page-primitives';
import { ClientFormattedDate } from '@/components/ui/client-formatted-date';

export const metadata: Metadata = {
  title: 'Notifications',
  robots: { index: false, follow: false },
};

export default async function AdminNotificationsPage(): Promise<React.ReactElement> {
  await requirePermissionOrRedirect('NOTIFICATIONS', 'VIEW', '/admin/notifications');
  const result = await listNotifications(1, 50);
  const items = result.ok ? result.data.items : [];

  return (
    <>
      <PageHeader
        title="Notifications"
        description="All system, security, and activity notifications."
      />
      {items.length === 0 ? (
        <EmptyState
          title="You're all caught up"
          description="New leads, contacts, and system alerts will appear here."
        />
      ) : (
        <ul className="flex flex-col gap-2">
          {items.map((n) => (
            <li
              key={n.id}
              className={`rounded-lg border border-[color:var(--color-border-default)] p-4 ${n.readAt ? 'bg-[color:var(--color-bg-surface)]' : 'bg-[color:var(--color-brand-tint)]'}`}
            >
              <p className="text-small font-semibold text-[color:var(--color-text-primary)]">
                {n.title}
              </p>
              {n.body && (
                <p className="mt-1 text-small text-[color:var(--color-text-muted)]">{n.body}</p>
              )}
              <p className="mt-1 text-overline text-[color:var(--color-text-muted)]">
                <ClientFormattedDate date={n.createdAt} />
              </p>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
