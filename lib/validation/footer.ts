import { z } from 'zod';

/** Footer Builder validation (Stage 4 §13). */
export const footerConfigSchema = z.object({
  columns: z.array(
    z.object({
      title: z.string().trim().min(1),
      links: z.array(z.object({ label: z.string().trim().min(1), href: z.string().trim().min(1) })),
    }),
  ),
  copyright: z.string().trim().max(300).optional(),
  showNewsletter: z.boolean().default(true),
});
export type FooterConfigInput = z.infer<typeof footerConfigSchema>;
