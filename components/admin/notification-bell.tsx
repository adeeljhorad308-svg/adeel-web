'use client';

import { useEffect, useState } from 'react';
import { Bell } from 'lucide-react';
import { listNotifications, markNotificationRead, markAllNotificationsRead } from '@/lib/actions/notification-actions';
import { ClientFormattedDate } from '@/components/ui/client-formatted-date';
import type { Notification } from '@prisma/client';

/** Notification bell + dropdown panel (Stage 4 §16), mounted in the topbar. */
export function NotificationBell(): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loaded, setLoaded] = useState(false);

  async function load(): Promise<void> {
    const result = await listNotifications(1, 10);
    if (result.ok) {
      setItems([...result.data.items]);
      setUnreadCount(result.data.unreadCount);
    }
    setLoaded(true);
  }

  useEffect(() => {
    void load();
    const interval = setInterval(() => void load(), 60000);
    return () => clearInterval(interval);
  }, []);

  async function openPanel(): Promise<void> {
    setOpen((v) => !v);
    if (!loaded) await load();
  }

  async function markRead(n: Notification): Promise<void> {
    if (n.readAt) return;
    setItems((prev) => prev.map((i) => (i.id === n.id ? { ...i, readAt: new Date() } : i)));
    setUnreadCount((c) => Math.max(0, c - 1));
    await markNotificationRead(n.id);
  }

  async function markAll(): Promise<void> {
    setItems((prev) => prev.map((i) => ({ ...i, readAt: i.readAt ?? new Date() })));
    setUnreadCount(0);
    await markAllNotificationsRead();
  }

  return (
    <div className="relative">
      <button onClick={() => void openPanel()} aria-label={`Notifications${unreadCount > 0 ? `, ${unreadCount} unread` : ''}`} className="relative rounded-md p-2 text-[color:var(--color-text-body)] hover:bg-[color:var(--color-bg-subtle)]">
        <Bell className="h-5 w-5" aria-hidden="true" />
        {unreadCount > 0 && <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-[color:var(--color-feedback-error)]" aria-hidden="true" />}
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-80 rounded-md border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] shadow-lg">
          <div className="flex items-center justify-between border-b border-[color:var(--color-border-default)] p-3">
            <p className="text-small font-semibold">Notifications</p>
            {unreadCount > 0 && <button onClick={() => void markAll()} className="text-overline text-[color:var(--color-brand-primary)]">Mark all read</button>}
          </div>
          <div className="max-h-80 overflow-y-auto">
            {items.length === 0 && <p className="p-4 text-small text-[color:var(--color-text-muted)]">You&apos;re all caught up.</p>}
            {items.map((n) => (
              <button key={n.id} onClick={() => void markRead(n)} className={`flex w-full flex-col gap-0.5 border-b border-[color:var(--color-border-default)] p-3 text-left last:border-0 ${n.readAt ? '' : 'bg-[color:var(--color-brand-tint)]'}`}>
                <p className="text-small font-medium text-[color:var(--color-text-primary)]">{n.title}</p>
                {n.body && <p className="text-small text-[color:var(--color-text-muted)]">{n.body}</p>}
                <p className="text-overline text-[color:var(--color-text-muted)]"><ClientFormattedDate date={n.createdAt} /></p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
