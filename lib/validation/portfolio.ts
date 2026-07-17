import { z } from 'zod';
import { zNonEmpty, zSlug, zPagination, zVersion, zOptionalUrl } from '@/lib/validation';

/** Portfolio Manager validation (Stage 4 §3). */

export const projectListSchema = zPagination.extend({
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  categoryId: z.string().cuid().optional(),
  featured: z.coerce.boolean().optional(),
  search: z.string().trim().optional(),
});
export type ProjectListInput = z.infer<typeof projectListSchema>;

const narrativeInput = z.object({
  type: z.enum(['OVERVIEW', 'CHALLENGE', 'APPROACH', 'SOLUTION']),
  bodyRich: z.string().trim().min(1),
  order: z.number().int().default(0),
});
const metricInput = z.object({ label: zNonEmpty('Label'), value: zNonEmpty('Value'), order: z.number().int().default(0) });
const mediaInput = z.object({ mediaId: z.string().cuid(), isCover: z.boolean().default(false), order: z.number().int().default(0) });

export const upsertProjectSchema = z
  .object({
    id: z.string().cuid().optional(),
    version: zVersion.optional(),
    title: zNonEmpty('Title'),
    slug: zSlug,
    clientName: z.string().trim().optional(),
    categoryId: z.string().cuid().nullable().optional(),
    completionDate: z.coerce.date().optional(),
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
    featured: z.boolean().default(false),
    order: z.number().int().default(0),
    liveUrl: zOptionalUrl,
    githubUrl: zOptionalUrl,
    overview: z.string().trim().optional(),
    seoTitle: z.string().trim().max(70).optional(),
    seoDescription: z.string().trim().max(160).optional(),
    ogImageId: z.string().cuid().nullable().optional(),
    testimonialId: z.string().cuid().nullable().optional(),
    nextProjectId: z.string().cuid().nullable().optional(),
    narratives: z.array(narrativeInput).default([]),
    metrics: z.array(metricInput).default([]),
    media: z.array(mediaInput).default([]),
    technologyIds: z.array(z.string().cuid()).default([]),
  })
  .refine((data) => data.id === undefined || data.version !== undefined, {
    message: 'A version is required when updating an existing project.',
    path: ['version'],
  });
export type UpsertProjectInput = z.infer<typeof upsertProjectSchema>;

export const reorderProjectsSchema = z.object({
  items: z.array(z.object({ id: z.string().cuid(), order: z.number().int() })),
});
