'use server';

import {
  finalizeUpload as _finalizeUpload,
  listMedia as _listMedia,
  updateMedia as _updateMedia,
  deleteMedia as _deleteMedia,
  createFolder as _createFolder,
} from '@/lib/services/media-service';
import type { MediaListInput } from '@/lib/validation/media';

/** Server Action boundary for the Media Library module (see blog-actions.ts for rationale). */
export async function finalizeUpload(input: unknown) {
  return _finalizeUpload(input);
}

export async function listMedia(input: MediaListInput) {
  return _listMedia(input);
}

export async function updateMedia(input: unknown) {
  return _updateMedia(input);
}

export async function deleteMedia(id: string, confirmed = false) {
  return _deleteMedia(id, confirmed);
}

export async function createFolder(input: unknown) {
  return _createFolder(input);
}
