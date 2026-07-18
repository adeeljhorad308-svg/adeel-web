import { z } from 'zod';
import { zEmail, zOptionalUrl } from '@/lib/validation';

/**
 * Settings validation (Stage 4 §17, Stage 5 §16). Grouped by the Company Details
 * Reference sections: company info, social links, and non-secret integration IDs.
 * Secret values (SMTP password, API keys) are never accepted here — those live in
 * environment variables per the Master Spec; this only stores non-secret config
 * (e.g. an analytics Measurement ID) and references.
 */

export const companySettingsSchema = z.object({
  name: z.string().trim().min(1).optional(),
  tagline: z.string().trim().max(200).optional(),
  phone: z.string().trim().max(40).optional(),
  email: zEmail.optional(),
  whatsapp: z.string().trim().max(40).optional(),
  address: z.string().trim().max(300).optional(),
  officeHours: z.string().trim().max(200).optional(),
  googleMapsEmbedUrl: zOptionalUrl,
});
export type CompanySettingsInput = z.infer<typeof companySettingsSchema>;

const SOCIAL_PLATFORMS = [
  'github',
  'linkedin',
  'facebook',
  'instagram',
  'whatsapp',
  'email',
  'youtube',
  'x',
  'tiktok',
] as const;

export const socialLinksSchema = z.object({
  links: z.array(
    z.object({
      platform: z.enum(SOCIAL_PLATFORMS),
      url: z.union([z.string().trim().url(), z.literal('')]),
      visible: z.boolean().default(true),
    }),
  ),
});
export type SocialLinksInput = z.infer<typeof socialLinksSchema>;

export const analyticsSettingsSchema = z.object({
  gaId: z.string().trim().max(50).optional(),
  gtmId: z.string().trim().max(50).optional(),
  metaPixelId: z.string().trim().max(50).optional(),
  clarityId: z.string().trim().max(50).optional(),
});
export type AnalyticsSettingsInput = z.infer<typeof analyticsSettingsSchema>;
