import { z } from 'zod';
import { zNonEmpty, zSlug, zPagination, zVersion } from '@/lib/validation';

/** Industries validation (Stage 4 §4 pattern applied to Stage 3 Pages 3–4). */

export const industryListSchema = zPagination.extend({
  visible: z.coerce.boolean().optional(),
  search: z.string().trim().optional(),
});
export type IndustryListInput = z.infer<typeof industryListSchema>;

const challengeInput = z.object({
  iconKey: zNonEmpty('Icon'),
  label: zNonEmpty('Challenge'),
  order: z.number().int().default(0),
});
const solutionMappingInput = z.object({
  serviceId: z.string().cuid(),
  label: z.string().trim().optional(),
  order: z.number().int().default(0),
});
const industryFaqInput = z.object({
  question: zNonEmpty('Question'),
  answer: zNonEmpty('Answer'),
  order: z.number().int().default(0),
});

export const upsertIndustrySchema = z
  .object({
    id: z.string().cuid().optional(),
    version: zVersion.optional(),
    name: zNonEmpty('Name'),
    slug: zSlug,
    iconKey: zNonEmpty('Icon'),
    tagline: z.string().trim().optional(),
    heroImageId: z.string().cuid().nullable().optional(),
    order: z.number().int().default(0),
    visible: z.boolean().default(true),
    seoTitle: z.string().trim().max(70).optional(),
    seoDescription: z.string().trim().max(160).optional(),
    challenges: z.array(challengeInput).default([]),
    solutionMappings: z.array(solutionMappingInput).default([]),
    faqs: z.array(industryFaqInput).default([]),
  })
  .refine((data) => data.id === undefined || data.version !== undefined, {
    message: 'A version is required when updating an existing industry.',
    path: ['version'],
  });
export type UpsertIndustryInput = z.infer<typeof upsertIndustrySchema>;
