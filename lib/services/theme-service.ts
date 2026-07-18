import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { requirePermission } from '@/lib/auth/guards';
import { parseOrThrow } from '@/lib/validation';
import { themeConfigSchema, type ThemeConfigInput } from '@/lib/validation/theme';
import { meetsAA } from '@/lib/utils/contrast';
import { semanticColors } from '@/tokens/tokens';
import { recordActivity } from '@/lib/logging/activity';
import { toActionError } from '@/lib/services/action-result';
import { ValidationError } from '@/lib/errors';
import type { ActionResult } from '@/lib/types';
import type { ThemeConfig } from '@prisma/client';

/**
 * Theme Manager service (Stage 4 §11; Stage 1 token bridge).
 *
 * Persists Tier-2 semantic token overrides. On save, validates the pairs that
 * matter for readability (text-on-page, text-on-surface, brand-on-white) against
 * WCAG AA and blocks the save with field-level errors on failure — the Theme
 * Manager cannot ship an inaccessible palette. A single row holds the live config;
 * there is intentionally one active theme (no draft/publish split at this layer).
 */

function validateContrast(tokens: ThemeConfigInput['tokensLight']): void {
  const pairs: Array<[string, string, string]> = [
    ['text-primary', 'bg-page', 'text-primary on bg-page'],
    ['text-body', 'bg-surface', 'text-body on bg-surface'],
    ['brand-primary', 'bg-page', 'brand-primary on bg-page'],
  ];
  const fields: Record<string, string> = {};
  for (const [fg, bg, label] of pairs) {
    const fgHex = tokens[fg as keyof typeof tokens];
    const bgHex = tokens[bg as keyof typeof tokens];
    if (!meetsAA(fgHex, bgHex)) {
      fields[fg] = `${label} does not meet WCAG AA contrast (needs 4.5:1).`;
    }
  }
  if (Object.keys(fields).length > 0) {
    throw new ValidationError('This palette fails accessibility contrast checks.', fields);
  }
}

export async function getThemeConfig(): Promise<ActionResult<ThemeConfig | null>> {
  try {
    await requirePermission('THEME', 'VIEW');
    const config = await prisma.themeConfig.findFirst();
    return { ok: true, data: config };
  } catch (error) {
    return toActionError(error);
  }
}

export async function saveThemeConfig(input: unknown): Promise<ActionResult<ThemeConfig>> {
  try {
    const user = await requirePermission('THEME', 'EDIT');
    const data = parseOrThrow(themeConfigSchema, input);

    validateContrast(data.tokensLight);
    validateContrast(data.tokensDark);

    const payload = {
      tokensLight: data.tokensLight,
      tokensDark: data.tokensDark,
      ...(data.fontDisplay !== undefined ? { fontDisplay: data.fontDisplay } : {}),
      ...(data.fontBody !== undefined ? { fontBody: data.fontBody } : {}),
      ...(data.fontMono !== undefined ? { fontMono: data.fontMono } : {}),
      ...(data.defaultMode !== undefined ? { defaultMode: data.defaultMode } : {}),
      logoPrimaryId: data.logoPrimaryId ?? null,
      logoWhiteId: data.logoWhiteId ?? null,
      logoDarkId: data.logoDarkId ?? null,
      faviconId: data.faviconId ?? null,
    };

    const existing = await prisma.themeConfig.findFirst();
    const config = existing
      ? await prisma.themeConfig.update({ where: { id: existing.id }, data: payload })
      : await prisma.themeConfig.create({ data: payload });

    await recordActivity({
      actorId: user.id,
      action: 'theme.update',
      targetType: 'ThemeConfig',
      targetId: config.id,
    });

    return { ok: true, data: config };
  } catch (error) {
    return toActionError(error);
  }
}

/** Default token values (Stage 1) used to seed the ThemeConfig row on first run. */
export function defaultThemeTokens(): {
  light: Record<string, string>;
  dark: Record<string, string>;
} {
  const light: Record<string, string> = {};
  const dark: Record<string, string> = {};
  for (const [name, token] of Object.entries(semanticColors)) {
    light[name] = token.light;
    dark[name] = token.dark;
  }
  return { light, dark };
}
