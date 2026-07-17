import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { requirePermission } from '@/lib/auth/guards';
import { parseOrThrow } from '@/lib/validation';
import {
  companySettingsSchema,
  socialLinksSchema,
  analyticsSettingsSchema,
} from '@/lib/validation/settings';
import { recordActivity } from '@/lib/logging/activity';
import { toActionError } from '@/lib/services/action-result';
import type { ActionResult } from '@/lib/types';
import type { Prisma } from '@prisma/client';

/**
 * Settings service (Stage 4 §17). Everything editable, non-secret (Stage 5 §16 —
 * API keys and SMTP credentials live in environment variables, never here). Each
 * group is read/written independently so one section's edit never risks another.
 */

async function getGroup(group: string): Promise<Record<string, unknown>> {
  const rows = await prisma.setting.findMany({ where: { group } });
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

async function saveGroup(
  group: string,
  values: Record<string, unknown>,
  actorId: string,
): Promise<void> {
  await prisma.$transaction(async (tx) => {
    for (const [key, value] of Object.entries(values)) {
      if (value === undefined) continue;
      await tx.setting.upsert({
        where: { group_key: { group, key } },
        create: { group, key, value: value as Prisma.InputJsonValue },
        update: { value: value as Prisma.InputJsonValue },
      });
    }
    await recordActivity({ actorId, action: `settings.${group}.update` }, tx);
  });
}

export async function getCompanySettings(): Promise<ActionResult<Record<string, unknown>>> {
  try {
    await requirePermission('SETTINGS', 'VIEW');
    return { ok: true, data: await getGroup('company') };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateCompanySettings(input: unknown): Promise<ActionResult<{ saved: true }>> {
  try {
    const user = await requirePermission('SETTINGS', 'EDIT');
    const data = parseOrThrow(companySettingsSchema, input);
    await saveGroup('company', data, user.id);
    return { ok: true, data: { saved: true } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function getSocialLinks(): Promise<ActionResult<Record<string, unknown>>> {
  try {
    await requirePermission('SETTINGS', 'VIEW');
    return { ok: true, data: await getGroup('social') };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateSocialLinks(input: unknown): Promise<ActionResult<{ saved: true }>> {
  try {
    const user = await requirePermission('SETTINGS', 'EDIT');
    const data = parseOrThrow(socialLinksSchema, input);
    await saveGroup('social', { links: data.links }, user.id);
    return { ok: true, data: { saved: true } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function getAnalyticsSettings(): Promise<ActionResult<Record<string, unknown>>> {
  try {
    await requirePermission('SETTINGS', 'VIEW');
    return { ok: true, data: await getGroup('analytics') };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateAnalyticsSettings(input: unknown): Promise<ActionResult<{ saved: true }>> {
  try {
    const user = await requirePermission('SETTINGS', 'EDIT');
    const data = parseOrThrow(analyticsSettingsSchema, input);
    await saveGroup('analytics', data, user.id);
    return { ok: true, data: { saved: true } };
  } catch (error) {
    return toActionError(error);
  }
}
