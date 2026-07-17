import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logging/logger';
import type { Prisma } from '@prisma/client';

/**
 * Durable activity/audit logging (Stage 5 §13; Master Spec activity logs).
 *
 * Distinct from the app logger: activity logs are business/security events that
 * must be queryable and retained (admin login, role change, content publish, …).
 * Writing is best-effort with respect to the primary operation — a logging
 * failure must never break the user action — but failures are surfaced to the
 * app logger for monitoring.
 */

export interface ActivityInput {
  readonly actorId?: string | null;
  readonly action: string; // dot-namespaced, e.g. "users.role.change"
  readonly targetType?: string;
  readonly targetId?: string;
  readonly metadata?: Prisma.InputJsonValue;
  readonly ip?: string | null;
}

/**
 * Record an activity event. Accepts an optional transaction client so callers can
 * make the log part of the same atomic operation when correctness requires it.
 */
export async function recordActivity(
  input: ActivityInput,
  tx?: Prisma.TransactionClient,
): Promise<void> {
  const client = tx ?? prisma;
  try {
    await client.activityLog.create({
      data: {
        actorId: input.actorId ?? null,
        action: input.action,
        targetType: input.targetType ?? null,
        targetId: input.targetId ?? null,
        ...(input.metadata !== undefined ? { metadata: input.metadata } : {}),
        ip: input.ip ?? null,
      },
    });
  } catch (error) {
    // Never let audit logging break the primary flow; report for monitoring.
    logger.error({ err: error, action: input.action }, 'Failed to record activity log');
  }
}
