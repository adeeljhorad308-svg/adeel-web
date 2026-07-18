import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { requirePermission } from '@/lib/auth/guards';
import { toActionError } from '@/lib/services/action-result';
import type { ActionResult, Paginated } from '@/lib/types';
import type { Notification, NotificationType, Role, Prisma } from '@prisma/client';

/**
 * Notification service (Stage 4 §16, Stage 5 §15). `notify()` is the single
 * emission point every domain module calls — new lead, new contact, new
 * project publish, system/security/update events — so delivery is consistent.
 * Critical types (LEAD, CONTACT, SECURITY) should also enqueue an email job by
 * the caller; this service only handles the in-app record.
 */
export async function notify(
  input: {
    type: NotificationType;
    title: string;
    body?: string;
    link?: string;
    targetUserId?: string;
    targetRole?: Role;
  },
  tx?: Prisma.TransactionClient,
): Promise<void> {
  const client = tx ?? prisma;
  await client.notification.create({
    data: {
      type: input.type,
      title: input.title,
      body: input.body ?? null,
      link: input.link ?? null,
      targetUserId: input.targetUserId ?? null,
      targetRole: input.targetRole ?? null,
    },
  });
}

export async function listNotifications(
  page = 1,
  pageSize = 20,
): Promise<ActionResult<Paginated<Notification> & { unreadCount: number }>> {
  try {
    const user = await requirePermission('NOTIFICATIONS', 'VIEW');
    const where = {
      OR: [
        { targetUserId: user.id },
        { targetRole: user.role },
        { targetUserId: null, targetRole: null },
      ],
    };
    const [items, total, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({ where: { ...where, readAt: null } }),
    ]);
    return { ok: true, data: { items, total, page, pageSize, unreadCount } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function markNotificationRead(id: string): Promise<ActionResult<{ read: true }>> {
  try {
    await requirePermission('NOTIFICATIONS', 'VIEW');
    await prisma.notification.update({ where: { id }, data: { readAt: new Date() } });
    return { ok: true, data: { read: true } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function markAllNotificationsRead(): Promise<ActionResult<{ read: true }>> {
  try {
    const user = await requirePermission('NOTIFICATIONS', 'VIEW');
    await prisma.notification.updateMany({
      where: { OR: [{ targetUserId: user.id }, { targetRole: user.role }], readAt: null },
      data: { readAt: new Date() },
    });
    return { ok: true, data: { read: true } };
  } catch (error) {
    return toActionError(error);
  }
}
