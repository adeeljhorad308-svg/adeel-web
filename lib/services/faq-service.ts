import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { requirePermission } from '@/lib/auth/guards';
import { parseOrThrow } from '@/lib/validation';
import { upsertFaqSchema } from '@/lib/validation/faq';
import { sanitizeRichText } from '@/lib/security/sanitize';
import { recordActivity } from '@/lib/logging/activity';
import { toActionError } from '@/lib/services/action-result';
import type { ActionResult } from '@/lib/types';
import type { GlobalFaq } from '@prisma/client';

/**
 * Global FAQ service (Stage 2 §10). Deliberately not version-locked: FAQ entries
 * are simple, low-cardinality, low-conflict-risk content (unlike Services or
 * Portfolio, which have many interdependent fields and higher edit contention).
 * Every module that follows the heavier pattern does so because it needs it —
 * applying optimistic locking here would be complexity without benefit.
 */

export async function listFaqs(): Promise<ActionResult<GlobalFaq[]>> {
  try {
    await requirePermission('SETTINGS', 'VIEW');
    const faqs = await prisma.globalFaq.findMany({ orderBy: { order: 'asc' } });
    return { ok: true, data: faqs };
  } catch (error) {
    return toActionError(error);
  }
}

export async function upsertFaq(input: unknown): Promise<ActionResult<GlobalFaq>> {
  try {
    const data = parseOrThrow(upsertFaqSchema, input);
    const user = await requirePermission('SETTINGS', data.id ? 'EDIT' : 'CREATE');

    const payload = {
      question: data.question,
      answer: sanitizeRichText(data.answer),
      order: data.order,
      visible: data.visible,
    };

    const faq = data.id
      ? await prisma.globalFaq.update({ where: { id: data.id }, data: payload })
      : await prisma.globalFaq.create({ data: payload });

    await recordActivity({
      actorId: user.id,
      action: data.id ? 'faq.update' : 'faq.create',
      targetType: 'GlobalFaq',
      targetId: faq.id,
    });

    return { ok: true, data: faq };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteFaq(id: string): Promise<ActionResult<{ deleted: true }>> {
  try {
    const user = await requirePermission('SETTINGS', 'DELETE');
    await prisma.globalFaq.delete({ where: { id } });
    await recordActivity({
      actorId: user.id,
      action: 'faq.delete',
      targetType: 'GlobalFaq',
      targetId: id,
    });
    return { ok: true, data: { deleted: true } };
  } catch (error) {
    return toActionError(error);
  }
}
