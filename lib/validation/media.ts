import { z } from 'zod';
import { zNonEmpty, zPagination } from '@/lib/validation';

/** Media Library validation schemas (Stage 4 §10). */

export const mediaListSchema = zPagination.extend({
  folderId: z.string().cuid().optional(),
  type: z.enum(['IMAGE', 'VIDEO', 'PDF', 'DOCUMENT', 'SVG']).optional(),
  search: z.string().trim().optional(),
});
export type MediaListInput = z.infer<typeof mediaListSchema>;

export const finalizeUploadSchema = z.object({
  publicId: zNonEmpty('publicId'),
  url: z.string().url(),
  mimeType: zNonEmpty('mimeType'),
  sizeBytes: z.number().int().positive(),
  width: z.number().int().positive().optional(),
  height: z.number().int().positive().optional(),
  folderId: z.string().cuid().optional(),
  altText: z.string().trim().max(300).optional(),
});
export type FinalizeUploadInput = z.infer<typeof finalizeUploadSchema>;

export const updateMediaSchema = z.object({
  id: zNonEmpty('id'),
  altText: z.string().trim().max(300).optional(),
  folderId: z.string().cuid().nullable().optional(),
});
export type UpdateMediaInput = z.infer<typeof updateMediaSchema>;

export const createFolderSchema = z.object({
  name: zNonEmpty('Folder name'),
  parentId: z.string().cuid().optional(),
});
