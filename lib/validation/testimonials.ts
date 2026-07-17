import { z } from 'zod';
import { zNonEmpty, zPagination, zVersion, zOptionalUrl } from '@/lib/validation';

/** Testimonials validation (Stage 4 §6). */

export const testimonialListSchema = zPagination.extend({
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
});
export type TestimonialListInput = z.infer<typeof testimonialListSchema>;

export const upsertTestimonialSchema = z
  .object({
    id: z.string().cuid().optional(),
    version: zVersion.optional(),
    clientName: zNonEmpty('Client name'),
    company: z.string().trim().optional(),
    companyLogoId: z.string().cuid().nullable().optional(),
    photoId: z.string().cuid().nullable().optional(),
    country: z.string().trim().optional(),
    rating: z.number().int().min(1).max(5),
    reviewText: zNonEmpty('Review'),
    videoUrl: zOptionalUrl,
    status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).default('DRAFT'),
    order: z.number().int().default(0),
  })
  .refine((data) => data.id === undefined || data.version !== undefined, {
    message: 'A version is required when updating an existing testimonial.',
    path: ['version'],
  });
export type UpsertTestimonialInput = z.infer<typeof upsertTestimonialSchema>;
