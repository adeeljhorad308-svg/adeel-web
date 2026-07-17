import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { requirePermission } from '@/lib/auth/guards';
import { toActionError } from '@/lib/services/action-result';
import type { ActionResult } from '@/lib/types';
import type { VersionedEntity, Module as PermModule } from '@prisma/client';

/**
 * Content version history (Stage 5 improvement: visual diff + rollback).
 *
 * Every versioned module writes a full JSON snapshot to `ContentVersion` on each
 * save (see each module's service). This shared reader lists those snapshots and
 * computes a shallow field-level diff between consecutive versions — sufficient
 * for a "what changed" view without a heavyweight diff library dependency.
 * Rollback re-submits a prior snapshot through the same upsert path used for
 * normal edits, so it goes through the identical validation, authorization, and
 * optimistic-locking checks — it is not a raw database write.
 */

export interface DiffEntry {
  readonly field: string;
  readonly before: unknown;
  readonly after: unknown;
}

export interface VersionListItem {
  readonly versionNo: number;
  readonly authorId: string | null;
  readonly createdAt: Date;
  readonly diff: readonly DiffEntry[];
}

function shallowDiff(before: Record<string, unknown>, after: Record<string, unknown>): DiffEntry[] {
  const keys = new Set([...Object.keys(before), ...Object.keys(after)]);
  const diffs: DiffEntry[] = [];
  for (const key of keys) {
    const b = before[key];
    const a = after[key];
    if (JSON.stringify(b) !== JSON.stringify(a)) {
      diffs.push({ field: key, before: b, after: a });
    }
  }
  return diffs;
}

/** Which permission module governs each versioned entity, for RBAC checks. */
const ENTITY_MODULE: Record<VersionedEntity, PermModule> = {
  PROJECT: 'PORTFOLIO',
  SERVICE: 'SERVICES',
  INDUSTRY: 'INDUSTRIES',
  POST: 'BLOG',
  LEGAL_DOCUMENT: 'SETTINGS',
  SETTINGS: 'SETTINGS',
};

export async function listVersionHistory(
  entity: VersionedEntity,
  entityId: string,
): Promise<ActionResult<readonly VersionListItem[]>> {
  try {
    await requirePermission(ENTITY_MODULE[entity], 'VIEW');

    const rows = await prisma.contentVersion.findMany({
      where: { entity, entityId },
      orderBy: { versionNo: 'asc' },
    });

    const items: VersionListItem[] = rows.map((row, index) => {
      const previousRow = index > 0 ? rows[index - 1] : undefined;
      const previous = previousRow ? (previousRow.snapshot as Record<string, unknown>) : {};
      const current = row.snapshot as Record<string, unknown>;
      return {
        versionNo: row.versionNo,
        authorId: row.authorId,
        createdAt: row.createdAt,
        diff: index === 0 ? [] : shallowDiff(previous, current),
      };
    });

    return { ok: true, data: items.reverse() }; // newest first
  } catch (error) {
    return toActionError(error);
  }
}

/** Fetch a specific snapshot's raw data, for rollback pre-fill. */
export async function getVersionSnapshot(
  entity: VersionedEntity,
  entityId: string,
  versionNo: number,
): Promise<ActionResult<Record<string, unknown> | null>> {
  try {
    await requirePermission(ENTITY_MODULE[entity], 'VIEW');
    const row = await prisma.contentVersion.findUnique({
      where: { entity_entityId_versionNo: { entity, entityId, versionNo } },
    });
    return { ok: true, data: (row?.snapshot as Record<string, unknown>) ?? null };
  } catch (error) {
    return toActionError(error);
  }
}
