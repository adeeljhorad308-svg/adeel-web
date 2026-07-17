import { z } from 'zod';
import { zEmail, zNonEmpty, zPagination } from '@/lib/validation';

/** Public contact form validation (Stage 3 Page 11). */
export const contactFormSchema = z.object({
  name: zNonEmpty('Name'),
  email: zEmail,
  company: z.string().trim().optional(),
  phone: z.string().trim().optional(),
  serviceInterest: z.string().trim().optional(),
  budget: z.string().trim().optional(),
  message: zNonEmpty('Message'),
  // Honeypot: real users never fill this hidden field; bots often do.
  website: z.string().max(0, 'Spam detected.').optional(),
});
export type ContactFormInput = z.infer<typeof contactFormSchema>;

export const contactListSchema = zPagination.extend({
  replyStatus: z.enum(['NEW', 'REPLIED', 'CLOSED']).optional(),
  assignedUserId: z.string().cuid().optional(),
  search: z.string().trim().optional(),
});
export type ContactListInput = z.infer<typeof contactListSchema>;

export const updateContactSchema = z.object({
  id: zNonEmpty('id'),
  replyStatus: z.enum(['NEW', 'REPLIED', 'CLOSED']).optional(),
  assignedUserId: z.string().cuid().nullable().optional(),
});

export const addNoteSchema = z.object({
  contactId: z.string().cuid().optional(),
  leadId: z.string().cuid().optional(),
  body: zNonEmpty('Note'),
});
