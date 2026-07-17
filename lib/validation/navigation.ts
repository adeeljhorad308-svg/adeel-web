import { z } from 'zod';
import { zNonEmpty } from '@/lib/validation';

/** Navigation Builder validation (Stage 4 §12). */

export const navigationItemInputSchema = z.object({
  id: z.string().cuid().optional(), // absent = new item
  label: zNonEmpty('Label'),
  type: z.enum(['INTERNAL', 'EXTERNAL']),
  href: zNonEmpty('Link'),
  iconKey: z.string().trim().optional(),
  parentId: z.string().cuid().nullable().optional(),
  order: z.number().int().nonnegative().default(0),
  visible: z.boolean().default(true),
});

export const saveNavigationMenuSchema = z.object({
  context: z.enum(['HEADER', 'FOOTER']),
  name: zNonEmpty('Menu name'),
  items: z.array(navigationItemInputSchema),
});
export type SaveNavigationMenuInput = z.infer<typeof saveNavigationMenuSchema>;
