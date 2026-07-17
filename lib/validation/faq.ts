import { z } from 'zod';
import { zNonEmpty } from '@/lib/validation';

/** Global FAQ validation (Stage 2 §10). */
export const upsertFaqSchema = z.object({
  id: z.string().cuid().optional(),
  question: zNonEmpty('Question'),
  answer: zNonEmpty('Answer'),
  order: z.number().int().default(0),
  visible: z.boolean().default(true),
});
export type UpsertFaqInput = z.infer<typeof upsertFaqSchema>;
