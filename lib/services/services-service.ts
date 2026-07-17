import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { requirePermission } from '@/lib/auth/guards';
import { parseOrThrow } from '@/lib/validation';
import {
  serviceListSchema,
  upsertServiceSchema,
  reorderSchema,
  type ServiceListInput,
} from '@/lib/validation/services';
import { sanitizeRichText } from '@/lib/security/sanitize';
import { recordActivity } from '@/lib/logging/activity';
import { toActionError } from '@/lib/services/action-result';
import { ConflictError } from '@/lib/errors';
import type { ActionResult, Paginated } from '@/lib/types';
import type { Service, Prisma } from '@prisma/client';

/**
 * Services Manager service (Stage 4 §4).
 *
 * Every write to an existing service:
 *   1. Wraps in a Prisma transaction (service row + child collections together).
 *   2. Checks the client-supplied `version` against the current row — a mismatch
 *      throws ConflictError (409) so a second admin's stale save doesn't silently
 *      overwrite the first (Stage 5 improvement: optimistic concurrency).
 *   3. Increments `version` on success.
 *   4. Snapshots the new state into ContentVersion for diff/rollback (Stage 5
 *      improvement) and writes an activity log entry.
 *
 * Child collections (features, benefits, process steps, FAQs) are replaced
 * wholesale on each save — the editor sends the full authoritative list, which is
 * simpler and safer than diffing individual rows for content of this size.
 */

async function nextVersionNumber(tx: Prisma.TransactionClient, serviceId: string): Promise<number> {
  const last = await tx.contentVersion.findFirst({
    where: { entity: 'SERVICE', entityId: serviceId },
    orderBy: { versionNo: 'desc' },
    select: { versionNo: true },
  });
  return (last?.versionNo ?? 0) + 1;
}

export async function listServices(input: ServiceListInput): Promise<ActionResult<Paginated<Service>>> {
  try {
    await requirePermission('SERVICES', 'VIEW');
    const { page, pageSize, categoryId, visible, search } = parseOrThrow(serviceListSchema, input);

    const where: Prisma.ServiceWhereInput = {
      deletedAt: null,
      ...(categoryId !== undefined ? { categoryId } : {}),
      ...(visible !== undefined ? { visible } : {}),
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.service.findMany({ where, orderBy: { order: 'asc' }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.service.count({ where }),
    ]);

    return { ok: true, data: { items, total, page, pageSize } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function getService(id: string): Promise<ActionResult<Service | null>> {
  try {
    await requirePermission('SERVICES', 'VIEW');
    const service = await prisma.service.findFirst({
      where: { id, deletedAt: null },
      include: { features: true, benefits: true, processSteps: true, faqs: true },
    });
    return { ok: true, data: service };
  } catch (error) {
    return toActionError(error);
  }
}

export async function upsertService(input: unknown): Promise<ActionResult<Service>> {
  try {
    const data = parseOrThrow(upsertServiceSchema, input);
    const user = await requirePermission('SERVICES', data.id ? 'EDIT' : 'CREATE');
    const sanitizedDescription = sanitizeRichText(data.descriptionRich);

    const result = await prisma.$transaction(async (tx) => {
      let service: Service;

      if (data.id) {
        const current = await tx.service.findUniqueOrThrow({ where: { id: data.id } });
        if (current.version !== data.version) {
          throw new ConflictError();
        }
        service = await tx.service.update({
          where: { id: data.id },
          data: {
            name: data.name,
            slug: data.slug,
            categoryId: data.categoryId ?? null,
            iconKey: data.iconKey,
            shortBenefit: data.shortBenefit,
            descriptionRich: sanitizedDescription,
            pricingAmount: data.pricingAmount ?? null,
            pricingLabel: data.pricingLabel ?? null,
            pricingPeriod: data.pricingPeriod ?? null,
            order: data.order,
            visible: data.visible,
            seoTitle: data.seoTitle ?? null,
            seoDescription: data.seoDescription ?? null,
            ogImageId: data.ogImageId ?? null,
            quickFormEnabled: data.quickFormEnabled,
            version: { increment: 1 },
          },
        });

        await tx.serviceFeature.deleteMany({ where: { serviceId: service.id } });
        await tx.serviceBenefit.deleteMany({ where: { serviceId: service.id } });
        await tx.serviceProcessStep.deleteMany({ where: { serviceId: service.id } });
        await tx.serviceFaq.deleteMany({ where: { serviceId: service.id } });
      } else {
        service = await tx.service.create({
          data: {
            name: data.name,
            slug: data.slug,
            categoryId: data.categoryId ?? null,
            iconKey: data.iconKey,
            shortBenefit: data.shortBenefit,
            descriptionRich: sanitizedDescription,
            pricingAmount: data.pricingAmount ?? null,
            pricingLabel: data.pricingLabel ?? null,
            pricingPeriod: data.pricingPeriod ?? null,
            order: data.order,
            visible: data.visible,
            seoTitle: data.seoTitle ?? null,
            seoDescription: data.seoDescription ?? null,
            ogImageId: data.ogImageId ?? null,
            quickFormEnabled: data.quickFormEnabled,
          },
        });
      }

      if (data.features.length > 0) {
        await tx.serviceFeature.createMany({
          data: data.features.map((f) => ({ ...f, serviceId: service.id })),
        });
      }
      if (data.benefits.length > 0) {
        await tx.serviceBenefit.createMany({
          data: data.benefits.map((b) => ({ ...b, proof: b.proof ?? null, serviceId: service.id })),
        });
      }
      if (data.processSteps.length > 0) {
        await tx.serviceProcessStep.createMany({
          data: data.processSteps.map((s) => ({ ...s, serviceId: service.id })),
        });
      }
      if (data.faqs.length > 0) {
        await tx.serviceFaq.createMany({
          data: data.faqs.map((f) => ({ ...f, serviceId: service.id })),
        });
      }

      if (data.technologyIds.length > 0) {
        await tx.serviceTechnology.deleteMany({ where: { serviceId: service.id } });
        await tx.serviceTechnology.createMany({
          data: data.technologyIds.map((technologyId) => ({ serviceId: service.id, technologyId })),
        });
      }

      const versionNo = await nextVersionNumber(tx, service.id);
      await tx.contentVersion.create({
        data: {
          entity: 'SERVICE',
          entityId: service.id,
          versionNo,
          snapshot: data as unknown as Prisma.InputJsonValue,
          authorId: user.id,
        },
      });

      await recordActivity(
        {
          actorId: user.id,
          action: data.id ? 'services.update' : 'services.create',
          targetType: 'Service',
          targetId: service.id,
        },
        tx,
      );

      return service;
    });

    return { ok: true, data: result };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteService(id: string): Promise<ActionResult<{ deleted: true }>> {
  try {
    const user = await requirePermission('SERVICES', 'DELETE');
    await prisma.service.update({ where: { id }, data: { deletedAt: new Date(), visible: false } });
    await recordActivity({ actorId: user.id, action: 'services.delete', targetType: 'Service', targetId: id });
    return { ok: true, data: { deleted: true } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function reorderServices(input: unknown): Promise<ActionResult<{ reordered: true }>> {
  try {
    const user = await requirePermission('SERVICES', 'EDIT');
    const { items } = parseOrThrow(reorderSchema, input);

    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        await tx.service.update({ where: { id: item.id }, data: { order: item.order } });
      }
      await recordActivity({ actorId: user.id, action: 'services.reorder' }, tx);
    });

    return { ok: true, data: { reordered: true } };
  } catch (error) {
    return toActionError(error);
  }
}
