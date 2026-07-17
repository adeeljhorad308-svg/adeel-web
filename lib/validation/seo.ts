import { z } from 'zod';
import { zNonEmpty } from '@/lib/validation';

/** SEO Manager validation (Stage 4 §14). */

export const globalSeoConfigSchema = z.object({
  defaultTitle: zNonEmpty('Default title'),
  titleTemplate: zNonEmpty('Title template'),
  defaultDescription: z.string().trim().max(160),
  defaultOgImageId: z.string().cuid().nullable().optional(),
  twitterHandle: z.string().trim().optional(),
  robotsExtra: z.string().trim().optional(),
});
export type GlobalSeoConfigInput = z.infer<typeof globalSeoConfigSchema>;

export const seoOverrideSchema = z.object({
  pagePath: zNonEmpty('Page path'),
  title: z.string().trim().max(70).optional(),
  description: z.string().trim().max(160).optional(),
  ogImageId: z.string().cuid().nullable().optional(),
  canonicalUrl: z.string().trim().optional(),
  noindex: z.boolean().default(false),
});
export type SeoOverrideInput = z.infer<typeof seoOverrideSchema>;
