import { z } from 'zod';
import { zNonEmpty, zPagination, zVersion, zOptionalUrl } from '@/lib/validation';

/** Team Management validation (Stage 4 §5). */

export const teamListSchema = zPagination.extend({
  active: z.coerce.boolean().optional(),
  department: z.string().trim().optional(),
});
export type TeamListInput = z.infer<typeof teamListSchema>;

const skillInput = z.object({ label: zNonEmpty('Skill'), order: z.number().int().default(0) });
const socialLinkInput = z.object({
  platform: z.enum(['github', 'linkedin', 'facebook', 'instagram', 'whatsapp', 'email', 'youtube', 'x', 'tiktok']),
  url: zOptionalUrl,
  visible: z.boolean().default(true),
});

export const upsertTeamMemberSchema = z
  .object({
    id: z.string().cuid().optional(),
    version: zVersion.optional(),
    name: zNonEmpty('Name'),
    designation: zNonEmpty('Designation'),
    bio: z.string().trim().optional(),
    experience: z.string().trim().optional(),
    photoId: z.string().cuid().nullable().optional(),
    department: z.string().trim().optional(),
    order: z.number().int().default(0),
    active: z.boolean().default(true),
    skills: z.array(skillInput).default([]),
    socialLinks: z.array(socialLinkInput).default([]),
  })
  .refine((data) => data.id === undefined || data.version !== undefined, {
    message: 'A version is required when updating an existing team member.',
    path: ['version'],
  });
export type UpsertTeamMemberInput = z.infer<typeof upsertTeamMemberSchema>;
