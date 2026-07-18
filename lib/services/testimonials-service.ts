import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { requirePermission } from '@/lib/auth/guards';
import { parseOrThrow } from '@/lib/validation';
import {
  testimonialListSchema,
  upsertTestimonialSchema,
  type TestimonialListInput,
} from '@/lib/validation/testimonials';
import { recordActivity } from '@/lib/logging/activity';
import { toActionError } from '@/lib/services/action-result';
import { ConflictError } from '@/lib/errors';
import type { ActionResult, Paginated } from '@/lib/types';
import type { Testimonial, Prisma } from '@prisma/client';

/**
 * Testimonials service (Stage 4 §6). Publication gate is enforced by every
 * public reader querying `status: 'PUBLISHED'` only (Stage 2/3 contract: no
 * testimonial is ever fabricated or shown before an admin explicitly publishes
 * it, and the public section hides entirely when none are published).
 */

export async function listTestimonials(
  input: TestimonialListInput,
): Promise<ActionResult<Paginated<Testimonial>>> {
  try {
    await requirePermission('TESTIMONIALS', 'VIEW');
    const { page, pageSize, status } = parseOrThrow(testimonialListSchema, input);

    const where: Prisma.TestimonialWhereInput = {
      deletedAt: null,
      ...(status !== undefined ? { status } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.testimonial.findMany({
        where,
        orderBy: { order: 'asc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.testimonial.count({ where }),
    ]);

    return { ok: true, data: { items, total, page, pageSize } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function getTestimonial(id: string): Promise<ActionResult<Testimonial | null>> {
  try {
    await requirePermission('TESTIMONIALS', 'VIEW');
    const testimonial = await prisma.testimonial.findFirst({ where: { id, deletedAt: null } });
    return { ok: true, data: testimonial };
  } catch (error) {
    return toActionError(error);
  }
}

export async function upsertTestimonial(input: unknown): Promise<ActionResult<Testimonial>> {
  try {
    const data = parseOrThrow(upsertTestimonialSchema, input);
    const user = await requirePermission('TESTIMONIALS', data.id ? 'EDIT' : 'CREATE');

    const baseData = {
      clientName: data.clientName,
      company: data.company ?? null,
      companyLogoId: data.companyLogoId ?? null,
      photoId: data.photoId ?? null,
      country: data.country ?? null,
      rating: data.rating,
      reviewText: data.reviewText,
      videoUrl: data.videoUrl ?? null,
      status: data.status,
      order: data.order,
    };

    const result = await prisma.$transaction(async (tx) => {
      let testimonial: Testimonial;

      if (data.id) {
        const current = await tx.testimonial.findUniqueOrThrow({ where: { id: data.id } });
        if (current.version !== data.version) throw new ConflictError();
        testimonial = await tx.testimonial.update({
          where: { id: data.id },
          data: { ...baseData, version: { increment: 1 } },
        });
      } else {
        testimonial = await tx.testimonial.create({ data: baseData });
      }

      await recordActivity(
        {
          actorId: user.id,
          action: data.id ? 'testimonials.update' : 'testimonials.create',
          targetType: 'Testimonial',
          targetId: testimonial.id,
        },
        tx,
      );

      return testimonial;
    });

    return { ok: true, data: result };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteTestimonial(id: string): Promise<ActionResult<{ deleted: true }>> {
  try {
    const user = await requirePermission('TESTIMONIALS', 'DELETE');
    await prisma.testimonial.update({
      where: { id },
      data: { deletedAt: new Date(), status: 'ARCHIVED' },
    });
    await recordActivity({
      actorId: user.id,
      action: 'testimonials.delete',
      targetType: 'Testimonial',
      targetId: id,
    });
    return { ok: true, data: { deleted: true } };
  } catch (error) {
    return toActionError(error);
  }
}
