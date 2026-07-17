import { z } from 'zod';
import { zNonEmpty, zSlug, zPagination, zVersion } from '@/lib/validation';

/** Blog CMS validation (Stage 4 §7, Stage 3 Pages 9–10). */

export const postListSchema = zPagination.extend({
  status: z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED']).optional(),
  categoryId: z.string().cuid().optional(),
  tagId: z.string().cuid().optional(),
  search: z.string().trim().optional(),
});
export type PostListInput = z.infer<typeof postListSchema>;

export const upsertPostSchema = z
  .object({
    id: z.string().cuid().optional(),
    version: zVersion.optional(),
    title: zNonEmpty('Title'),
    slug: zSlug,
    excerpt: z.string().trim().max(300).optional(),
    coverImageId: z.string().cuid().nullable().optional(),
    contentRich: z.string().trim().min(1, 'Content is required.'),
    categoryId: z.string().cuid().nullable().optional(),
    authorId: z.string().cuid().nullable().optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'SCHEDULED']).default('DRAFT'),
    scheduledAt: z.coerce.date().optional(),
    readingTimeOverride: z.number().int().positive().optional(),
    featured: z.boolean().default(false),
    seoTitle: z.string().trim().max(70).optional(),
    seoDescription: z.string().trim().max(160).optional(),
    ogImageId: z.string().cuid().nullable().optional(),
    canonicalUrl: z.string().trim().optional(),
    tagIds: z.array(z.string().cuid()).default([]),
    relatedPostIds: z.array(z.string().cuid()).default([]),
  })
  .refine((data) => data.id === undefined || data.version !== undefined, {
    message: 'A version is required when updating an existing post.',
    path: ['version'],
  })
  .refine((data) => data.status !== 'SCHEDULED' || data.scheduledAt !== undefined, {
    message: 'A scheduled date/time is required for scheduled posts.',
    path: ['scheduledAt'],
  });
export type UpsertPostInput = z.infer<typeof upsertPostSchema>;
