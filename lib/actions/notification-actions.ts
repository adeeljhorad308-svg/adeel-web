'use server';

import {
  listNotifications as _listNotifications,
  markNotificationRead as _markNotificationRead,
  markAllNotificationsRead as _markAllNotificationsRead,
} from '@/lib/services/notification-service';

/** Server Action boundary for the Notifications module (see blog-actions.ts for rationale). */
export async function listNotifications(page = 1, pageSize = 20) {
  return _listNotifications(page, pageSize);
}

export async function markNotificationRead(id: string) {
  return _markNotificationRead(id);
}

export async function markAllNotificationsRead() {
  return _markAllNotificationsRead();
}
