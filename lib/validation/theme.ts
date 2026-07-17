import { z } from 'zod';

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Enter a valid hex color, e.g. #2563EB.');

/** Semantic color token set the Theme Manager edits (mirrors tokens/tokens.ts). */
const semanticColorSet = z.object({
  'bg-page': hex,
  'bg-surface': hex,
  'bg-subtle': hex,
  'text-primary': hex,
  'text-body': hex,
  'text-muted': hex,
  'border-default': hex,
  'brand-primary': hex,
  'brand-hover': hex,
  'brand-tint': hex,
  'feedback-success': hex,
  'feedback-warning': hex,
  'feedback-error': hex,
});

export const themeConfigSchema = z.object({
  tokensLight: semanticColorSet,
  tokensDark: semanticColorSet,
  fontDisplay: z.string().trim().min(1).optional(),
  fontBody: z.string().trim().min(1).optional(),
  fontMono: z.string().trim().min(1).optional(),
  defaultMode: z.enum(['light', 'dark', 'system']).optional(),
  logoPrimaryId: z.string().cuid().nullable().optional(),
  logoWhiteId: z.string().cuid().nullable().optional(),
  logoDarkId: z.string().cuid().nullable().optional(),
  faviconId: z.string().cuid().nullable().optional(),
});
export type ThemeConfigInput = z.infer<typeof themeConfigSchema>;
