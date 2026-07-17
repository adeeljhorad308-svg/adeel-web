'use server';

import {
  listVersionHistory as _listVersionHistory,
  getVersionSnapshot as _getVersionSnapshot,
} from '@/lib/services/version-history-service';
import type { VersionedEntity } from '@prisma/client';

/** Server Action boundary for version history (see blog-actions.ts for rationale). */
export async function listVersionHistory(entity: VersionedEntity, entityId: string) {
  return _listVersionHistory(entity, entityId);
}

export async function getVersionSnapshot(entity: VersionedEntity, entityId: string, versionNo: number) {
  return _getVersionSnapshot(entity, entityId, versionNo);
}
