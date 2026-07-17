import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { requirePermission } from '@/lib/auth/guards';
import { parseOrThrow } from '@/lib/validation';
import {
  projectListSchema,
  upsertProjectSchema,
  reorderProjectsSchema,
  type ProjectListInput,
} from '@/lib/validation/portfolio';
import { sanitizeRichText } from '@/lib/security/sanitize';
import { recordActivity } from '@/lib/logging/activity';
import { toActionError } from '@/lib/services/action-result';
import { ConflictError } from '@/lib/errors';
import type { ActionResult, Paginated } from '@/lib/types';
import type { Project, Prisma } from '@prisma/client';

/**
 * Portfolio Manager service (Stage 4 §3). The richest content module: media
 * (multi-image/video/PDF with cover + order), narrative blocks, metrics, and a
 * technology tag set, plus optional links to a testimonial and a "next project".
 * Follows the same transaction + optimistic-lock + content-version pattern as
 * Services/Industries, replacing child collections wholesale per save.
 */

async function nextVersionNumber(tx: Prisma.TransactionClient, projectId: string): Promise<number> {
  const last = await tx.contentVersion.findFirst({
    where: { entity: 'PROJECT', entityId: projectId },
    orderBy: { versionNo: 'desc' },
    select: { versionNo: true },
  });
  return (last?.versionNo ?? 0) + 1;
}

export async function listProjects(input: ProjectListInput): Promise<ActionResult<Paginated<Project>>> {
  try {
    await requirePermission('PORTFOLIO', 'VIEW');
    const { page, pageSize, status, categoryId, featured, search } = parseOrThrow(projectListSchema, input);

    const where: Prisma.ProjectWhereInput = {
      deletedAt: null,
      ...(status !== undefined ? { status } : {}),
      ...(categoryId !== undefined ? { categoryId } : {}),
      ...(featured !== undefined ? { featured } : {}),
      ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.project.findMany({ where, orderBy: { order: 'asc' }, skip: (page - 1) * pageSize, take: pageSize }),
      prisma.project.count({ where }),
    ]);

    return { ok: true, data: { items, total, page, pageSize } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function getProject(id: string): Promise<ActionResult<Project | null>> {
  try {
    await requirePermission('PORTFOLIO', 'VIEW');
    const project = await prisma.project.findFirst({
      where: { id, deletedAt: null },
      include: { narratives: true, metrics: true, media: true, technologies: true },
    });
    return { ok: true, data: project };
  } catch (error) {
    return toActionError(error);
  }
}

export async function upsertProject(input: unknown): Promise<ActionResult<Project>> {
  try {
    const data = parseOrThrow(upsertProjectSchema, input);
    const user = await requirePermission('PORTFOLIO', data.id ? 'EDIT' : 'CREATE');

    const result = await prisma.$transaction(async (tx) => {
      let project: Project;
      const baseData = {
        title: data.title,
        slug: data.slug,
        clientName: data.clientName ?? null,
        categoryId: data.categoryId ?? null,
        completionDate: data.completionDate ?? null,
        status: data.status,
        featured: data.featured,
        order: data.order,
        liveUrl: data.liveUrl ?? null,
        githubUrl: data.githubUrl ?? null,
        overview: data.overview ? sanitizeRichText(data.overview) : null,
        seoTitle: data.seoTitle ?? null,
        seoDescription: data.seoDescription ?? null,
        ogImageId: data.ogImageId ?? null,
        testimonialId: data.testimonialId ?? null,
        nextProjectId: data.nextProjectId ?? null,
      };

      if (data.id) {
        const current = await tx.project.findUniqueOrThrow({ where: { id: data.id } });
        if (current.version !== data.version) throw new ConflictError();

        project = await tx.project.update({
          where: { id: data.id },
          data: { ...baseData, version: { increment: 1 } },
        });

        await tx.projectNarrative.deleteMany({ where: { projectId: project.id } });
        await tx.projectMetric.deleteMany({ where: { projectId: project.id } });
        await tx.projectMedia.deleteMany({ where: { projectId: project.id } });
        await tx.projectTechnology.deleteMany({ where: { projectId: project.id } });
      } else {
        project = await tx.project.create({ data: baseData });
      }

      if (data.narratives.length > 0) {
        await tx.projectNarrative.createMany({
          data: data.narratives.map((n) => ({ ...n, bodyRich: sanitizeRichText(n.bodyRich), projectId: project.id })),
        });
      }
      if (data.metrics.length > 0) {
        await tx.projectMetric.createMany({ data: data.metrics.map((m) => ({ ...m, projectId: project.id })) });
      }
      if (data.media.length > 0) {
        await tx.projectMedia.createMany({ data: data.media.map((m) => ({ ...m, projectId: project.id })) });
      }
      if (data.technologyIds.length > 0) {
        await tx.projectTechnology.createMany({
          data: data.technologyIds.map((technologyId) => ({ projectId: project.id, technologyId })),
        });
      }

      const versionNo = await nextVersionNumber(tx, project.id);
      await tx.contentVersion.create({
        data: {
          entity: 'PROJECT',
          entityId: project.id,
          versionNo,
          snapshot: data as unknown as Prisma.InputJsonValue,
          authorId: user.id,
        },
      });

      await recordActivity(
        {
          actorId: user.id,
          action: data.id ? 'portfolio.project.update' : 'portfolio.project.create',
          targetType: 'Project',
          targetId: project.id,
          metadata: { status: project.status },
        },
        tx,
      );

      return project;
    });

    return { ok: true, data: result };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteProject(id: string): Promise<ActionResult<{ deleted: true }>> {
  try {
    const user = await requirePermission('PORTFOLIO', 'DELETE');
    await prisma.project.update({ where: { id }, data: { deletedAt: new Date(), status: 'ARCHIVED' } });
    await recordActivity({
      actorId: user.id,
      action: 'portfolio.project.delete',
      targetType: 'Project',
      targetId: id,
    });
    return { ok: true, data: { deleted: true } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function reorderProjects(input: unknown): Promise<ActionResult<{ reordered: true }>> {
  try {
    const user = await requirePermission('PORTFOLIO', 'EDIT');
    const { items } = parseOrThrow(reorderProjectsSchema, input);

    await prisma.$transaction(async (tx) => {
      for (const item of items) {
        await tx.project.update({ where: { id: item.id }, data: { order: item.order } });
      }
      await recordActivity({ actorId: user.id, action: 'portfolio.project.reorder' }, tx);
    });

    return { ok: true, data: { reordered: true } };
  } catch (error) {
    return toActionError(error);
  }
}
