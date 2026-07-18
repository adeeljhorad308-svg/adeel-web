import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { requirePermission } from '@/lib/auth/guards';
import { parseOrThrow } from '@/lib/validation';
import { footerConfigSchema } from '@/lib/validation/footer';
import { recordActivity } from '@/lib/logging/activity';
import { toActionError } from '@/lib/services/action-result';
import type { ActionResult } from '@/lib/types';
import type { FooterConfig, Prisma } from '@prisma/client';

/**
 * Footer Builder service (Stage 4 §13). Single-row config; columns/links stored
 * as JSON since their shape is display configuration, not relational data that
 * needs independent querying. Social links themselves live in Settings (group
 * "social") per Stage 4 §17, and the public footer renders both together.
 */

export async function getFooterConfig(): Promise<ActionResult<FooterConfig | null>> {
  try {
    await requirePermission('FOOTER', 'VIEW');
    const config = await prisma.footerConfig.findFirst();
    return { ok: true, data: config };
  } catch (error) {
    return toActionError(error);
  }
}

export async function saveFooterConfig(input: unknown): Promise<ActionResult<FooterConfig>> {
  try {
    const user = await requirePermission('FOOTER', 'EDIT');
    const data = parseOrThrow(footerConfigSchema, input);

    const existing = await prisma.footerConfig.findFirst();
    const payload = {
      columns: data.columns as unknown as Prisma.InputJsonValue,
      copyright: data.copyright ?? null,
      showNewsletter: data.showNewsletter,
    };
    const config = existing
      ? await prisma.footerConfig.update({ where: { id: existing.id }, data: payload })
      : await prisma.footerConfig.create({ data: payload });

    await recordActivity({
      actorId: user.id,
      action: 'footer.update',
      targetType: 'FooterConfig',
      targetId: config.id,
    });

    return { ok: true, data: config };
  } catch (error) {
    return toActionError(error);
  }
}
