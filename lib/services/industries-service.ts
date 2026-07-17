import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { requirePermission } from '@/lib/auth/guards';
import { parseOrThrow } from '@/lib/validation';
import { industryListSchema, upsertIndustrySchema, type IndustryListInput } from '@/lib/validation/industries';
import { recordActivity } from '@/lib/logging/activity';
import { toActionError } from '@/lib/services/action-result';
import { ConflictError } from '@/lib/errors';
import type { ActionResult, Paginated } from '@/lib/types';
import type { Industry, Prisma } from '@prisma/client';

/**
 * Industries service (Stage 4 §4 pattern; Stage 3 Pages 3–4). Mirrors the
 * Services service's transaction + optimistic-locking + content-versioning
 * shape exactly, applied to Industry's child collections (challenges, solution
 * mappings, FAQs).
 */

async function nextVersionNumber(tx: Prisma.TransactionClient, industryId: string): Promise<number> {
  const last = await tx.contentVersion.findFirst({
    where: { entity: 'INDUSTRY', entityId: industryId },
    orderBy: { versionNo: 'desc' },
    select: { versionNo: true },
  });
  return (last?.versionNo ?? 0) + 1;
}

export async function listIndustries(input: IndustryListInput): Promise<ActionResult<Paginated<Industry>>> {
  try {
    await requirePermission('INDUSTRIES', 'VIEW');
    const { page, pageSize, visible, search } = parseOrThrow(industryListSchema, input);

    const where: Prisma.IndustryWhereInput = {
      deletedAt: null,
      ...(visible !== undefined ? { visible } : {}),
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.industry.findMany({ where, orderBy: { order: 'asc' }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.industry.count({ where }),
    ]);

    return { ok: true, data: { items, total, page, pageSize } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function getIndustry(id: string): Promise<ActionResult<Industry | null>> {
  try {
    await requirePermission('INDUSTRIES', 'VIEW');
    const industry = await prisma.industry.findFirst({
      where: { id, deletedAt: null },
      include: { challenges: true, solutionMappings: true, faqs: true },
    });
    return { ok: true, data: industry };
  } catch (error) {
    return toActionError(error);
  }
}

export async function upsertIndustry(input: unknown): Promise<ActionResult<Industry>> {
  try {
    const data = parseOrThrow(upsertIndustrySchema, input);
    const user = await requirePermission('INDUSTRIES', data.id ? 'EDIT' : 'CREATE');

    const result = await prisma.$transaction(async (tx) => {
      let industry: Industry;

      if (data.id) {
        const current = await tx.industry.findUniqueOrThrow({ where: { id: data.id } });
        if (current.version !== data.version) throw new ConflictError();

        industry = await tx.industry.update({
          where: { id: data.id },
          data: {
            name: data.name,
            slug: data.slug,
            iconKey: data.iconKey,
            tagline: data.tagline ?? null,
            heroImageId: data.heroImageId ?? null,
            order: data.order,
            visible: data.visible,
            seoTitle: data.seoTitle ?? null,
            seoDescription: data.seoDescription ?? null,
            version: { increment: 1 },
          },
        });

        await tx.industryChallenge.deleteMany({ where: { industryId: industry.id } });
        await tx.industrySolutionMapping.deleteMany({ where: { industryId: industry.id } });
        await tx.industryFaq.deleteMany({ where: { industryId: industry.id } });
      } else {
        industry = await tx.industry.create({
          data: {
            name: data.name,
            slug: data.slug,
            iconKey: data.iconKey,
            tagline: data.tagline ?? null,
            heroImageId: data.heroImageId ?? null,
            order: data.order,
            visible: data.visible,
            seoTitle: data.seoTitle ?? null,
            seoDescription: data.seoDescription ?? null,
          },
        });
      }

      if (data.challenges.length > 0) {
        await tx.industryChallenge.createMany({
          data: data.challenges.map((c) => ({ ...c, industryId: industry.id })),
        });
      }
      if (data.solutionMappings.length > 0) {
        await tx.industrySolutionMapping.createMany({
          data: data.solutionMappings.map((m) => ({ ...m, label: m.label ?? null, industryId: industry.id })),
        });
      }
      if (data.faqs.length > 0) {
        await tx.industryFaq.createMany({
          data: data.faqs.map((f) => ({ ...f, industryId: industry.id })),
        });
      }

      const versionNo = await nextVersionNumber(tx, industry.id);
      await tx.contentVersion.create({
        data: {
          entity: 'INDUSTRY',
          entityId: industry.id,
          versionNo,
          snapshot: data as unknown as Prisma.InputJsonValue,
          authorId: user.id,
        },
      });

      await recordActivity(
        {
          actorId: user.id,
          action: data.id ? 'industries.update' : 'industries.create',
          targetType: 'Industry',
          targetId: industry.id,
        },
        tx,
      );

      return industry;
    });

    return { ok: true, data: result };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteIndustry(id: string): Promise<ActionResult<{ deleted: true }>> {
  try {
    const user = await requirePermission('INDUSTRIES', 'DELETE');
    await prisma.industry.update({ where: { id }, data: { deletedAt: new Date(), visible: false } });
    await recordActivity({ actorId: user.id, action: 'industries.delete', targetType: 'Industry', targetId: id });
    return { ok: true, data: { deleted: true } };
  } catch (error) {
    return toActionError(error);
  }
}
