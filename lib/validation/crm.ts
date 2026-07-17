import { z } from 'zod';
import { zEmail, zNonEmpty, zPagination } from '@/lib/validation';

/** CRM / Leads validation (Stage 4 §9). */
export const leadListSchema = zPagination.extend({
  status: z.enum(['NEW', 'CONTACTED', 'PROPOSAL_SENT', 'WON', 'LOST']).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  assignedUserId: z.string().cuid().optional(),
  search: z.string().trim().optional(),
});
export type LeadListInput = z.infer<typeof leadListSchema>;

export const upsertLeadSchema = z.object({
  id: z.string().cuid().optional(),
  name: zNonEmpty('Name'),
  company: z.string().trim().optional(),
  email: zEmail,
  phone: z.string().trim().optional(),
  country: z.string().trim().optional(),
  industry: z.string().trim().optional(),
  budget: z.string().trim().optional(),
  timeline: z.string().trim().optional(),
  source: z.string().trim().optional(),
  status: z.enum(['NEW', 'CONTACTED', 'PROPOSAL_SENT', 'WON', 'LOST']).default('NEW'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
  assignedUserId: z.string().cuid().nullable().optional(),
  followUpDate: z.coerce.date().nullable().optional(),
  proposalSent: z.boolean().default(false),
  lostReason: z.string().trim().optional(),
});
export type UpsertLeadInput = z.infer<typeof upsertLeadSchema>;

export const moveLeadStageSchema = z.object({
  id: zNonEmpty('id'),
  status: z.enum(['NEW', 'CONTACTED', 'PROPOSAL_SENT', 'WON', 'LOST']),
  lostReason: z.string().trim().optional(),
});
