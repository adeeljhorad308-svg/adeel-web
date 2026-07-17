import { z } from 'zod';
import { zNonEmpty, zSlug, zPagination, zVersion } from '@/lib/validation';

/**
 * Services Manager validation (Stage 4 §4, Stage 3 Page 2). Every mutating input
 * carries the `version` the client last read; the service compares it against
 * the row's current version to detect concurrent edits (Stage 5 improvement:
 * optimistic concurrency) before writing.
 */

export const serviceListSchema = zPagination.extend({
  categoryId: z.string().cuid().optional(),
  visible: z.coerce.boolean().optional(),
  search: z.string().trim().optional(),
});
export type ServiceListInput = z.infer<typeof serviceListSchema>;

const serviceFeatureInput = z.object({ label: zNonEmpty('Feature'), order: z.number().int().default(0) });
const serviceBenefitInput = z.object({
  iconKey: zNonEmpty('Icon'),
  claim: zNonEmpty('Claim'),
  proof: z.string().trim().optional(),
  order: z.number().int().default(0),
});
const serviceProcessStepInput = z.object({
  title: zNonEmpty('Title'),
  body: zNonEmpty('Description'),
  order: z.number().int().default(0),
});
const serviceFaqInput = z.object({
  question: zNonEmpty('Question'),
  answer: zNonEmpty('Answer'),
  order: z.number().int().default(0),
});

export const upsertServiceSchema = z.object({
  id: z.string().cuid().optional(), // absent = create
  version: zVersion.optional(), // required when id is present
  name: zNonEmpty('Name'),
  slug: zSlug,
  categoryId: z.string().cuid().nullable().optional(),
  iconKey: zNonEmpty('Icon'),
  shortBenefit: zNonEmpty('Short benefit'),
  descriptionRich: z.string().trim().default(''),
  pricingAmount: z.number().int().nonnegative().nullable().optional(),
  pricingLabel: z.string().trim().nullable().optional(),
  pricingPeriod: z.string().trim().nullable().optional(),
  order: z.number().int().default(0),
  visible: z.boolean().default(true),
  seoTitle: z.string().trim().max(70).optional(),
  seoDescription: z.string().trim().max(160).optional(),
  ogImageId: z.string().cuid().nullable().optional(),
  quickFormEnabled: z.boolean().default(false),
  features: z.array(serviceFeatureInput).default([]),
  benefits: z.array(serviceBenefitInput).default([]),
  processSteps: z.array(serviceProcessStepInput).default([]),
  faqs: z.array(serviceFaqInput).default([]),
  technologyIds: z.array(z.string().cuid()).default([]),
}).refine((data) => data.id === undefined || data.version !== undefined, {
  message: 'A version is required when updating an existing service.',
  path: ['version'],
});
export type UpsertServiceInput = z.infer<typeof upsertServiceSchema>;

export const reorderSchema = z.object({
  items: z.array(z.object({ id: z.string().cuid(), order: z.number().int() })),
});
