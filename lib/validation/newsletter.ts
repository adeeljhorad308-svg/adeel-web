import { z } from 'zod';
import { zEmail } from '@/lib/validation';

export const newsletterSubscribeSchema = z.object({ email: zEmail });
export type NewsletterSubscribeInput = z.infer<typeof newsletterSubscribeSchema>;
