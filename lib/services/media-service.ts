import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { requirePermission } from '@/lib/auth/guards';
import { deleteAsset } from '@/lib/media/cloudinary';
import { parseOrThrow } from '@/lib/validation';
import {
  mediaListSchema,
  finalizeUploadSchema,
  updateMediaSchema,
  createFolderSchema,
  type MediaListInput,
} from '@/lib/validation/media';
import { recordActivity } from '@/lib/logging/activity';
import { toActionError } from '@/lib/services/action-result';
import type { ActionResult, Paginated } from '@/lib/types';
import type { Media, MediaType } from '@prisma/client';

/**
 * Media Library service (Stage 4 §10, Stage 5 §9).
 *
 * Upload flow (build-readiness fix): the actual file upload and content
 * validation happens in the /api/v1/media/upload Route Handler (server-side
 * MIME sniffing, executable rejection, SVG sanitization, then a
 * server-to-Cloudinary upload). This service's `finalizeUpload` only persists
 * a `Media` row from that route's already-validated result — it does not
 * itself receive or validate raw file content.
 *
 * Deletion checks for in-use references before removing, per Stage 4 §10 ("warn
 * if in use") — callers surface that warning; deletion here is the enforced path
 * once the caller has confirmed.
 */

function mimeToMediaType(mime: string): MediaType {
  if (mime === 'application/pdf') return 'PDF';
  if (mime === 'image/svg+xml') return 'SVG';
  if (mime.startsWith('video/')) return 'VIDEO';
  if (mime.startsWith('image/')) return 'IMAGE';
  return 'DOCUMENT';
}

export async function finalizeUpload(input: unknown): Promise<ActionResult<Media>> {
  try {
    const user = await requirePermission('MEDIA', 'CREATE');
    const data = parseOrThrow(finalizeUploadSchema, input);

    const media = await prisma.media.create({
      data: {
        url: data.url,
        publicId: data.publicId,
        type: mimeToMediaType(data.mimeType),
        mimeType: data.mimeType,
        sizeBytes: data.sizeBytes,
        width: data.width ?? null,
        height: data.height ?? null,
        altText: data.altText ?? null,
        folderId: data.folderId ?? null,
        uploadedById: user.id,
      },
    });

    await recordActivity({
      actorId: user.id,
      action: 'media.upload',
      targetType: 'Media',
      targetId: media.id,
    });

    return { ok: true, data: media };
  } catch (error) {
    return toActionError(error);
  }
}

export async function listMedia(input: MediaListInput): Promise<ActionResult<Paginated<Media>>> {
  try {
    await requirePermission('MEDIA', 'VIEW');
    const { page, pageSize, folderId, type, search } = parseOrThrow(mediaListSchema, input);

    const where = {
      ...(folderId !== undefined ? { folderId } : {}),
      ...(type !== undefined ? { type } : {}),
      ...(search ? { url: { contains: search, mode: 'insensitive' as const } } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.media.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.media.count({ where }),
    ]);

    return { ok: true, data: { items, total, page, pageSize } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function updateMedia(input: unknown): Promise<ActionResult<Media>> {
  try {
    const user = await requirePermission('MEDIA', 'EDIT');
    const data = parseOrThrow(updateMediaSchema, input);

    const media = await prisma.media.update({
      where: { id: data.id },
      data: {
        ...(data.altText !== undefined ? { altText: data.altText } : {}),
        ...(data.folderId !== undefined ? { folderId: data.folderId } : {}),
      },
    });

    await recordActivity({
      actorId: user.id,
      action: 'media.update',
      targetType: 'Media',
      targetId: media.id,
    });

    return { ok: true, data: media };
  } catch (error) {
    return toActionError(error);
  }
}

/** Check whether a media asset is referenced elsewhere before allowing deletion. */
async function findUsage(mediaId: string): Promise<string[]> {
  const usages: string[] = [];
  const [projectMedia, projectOg, serviceOg, industryHero, teamPhoto, testimonialPhoto, testimonialLogo] =
    await Promise.all([
      prisma.projectMedia.count({ where: { mediaId } }),
      prisma.project.count({ where: { ogImageId: mediaId } }),
      prisma.service.count({ where: { ogImageId: mediaId } }),
      prisma.industry.count({ where: { heroImageId: mediaId } }),
      prisma.teamMember.count({ where: { photoId: mediaId } }),
      prisma.testimonial.count({ where: { photoId: mediaId } }),
      prisma.testimonial.count({ where: { companyLogoId: mediaId } }),
    ]);
  if (projectMedia > 0) usages.push('Portfolio projects');
  if (projectOg > 0) usages.push('Project SEO image');
  if (serviceOg > 0) usages.push('Service SEO image');
  if (industryHero > 0) usages.push('Industry hero image');
  if (teamPhoto > 0) usages.push('Team member photo');
  if (testimonialPhoto > 0 || testimonialLogo > 0) usages.push('Testimonials');
  return usages;
}

export async function deleteMedia(
  id: string,
  confirmed = false,
): Promise<ActionResult<{ deleted: true } | { inUse: string[] }>> {
  try {
    const user = await requirePermission('MEDIA', 'DELETE');
    const media = await prisma.media.findUniqueOrThrow({ where: { id } });

    const usages = await findUsage(id);
    if (usages.length > 0 && !confirmed) {
      return { ok: true, data: { inUse: usages } };
    }

    await deleteAsset(media.publicId);
    await prisma.media.delete({ where: { id } });
    await recordActivity({ actorId: user.id, action: 'media.delete', targetType: 'Media', targetId: id });

    return { ok: true, data: { deleted: true } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function createFolder(input: unknown): Promise<ActionResult<{ id: string }>> {
  try {
    const user = await requirePermission('MEDIA', 'CREATE');
    const data = parseOrThrow(createFolderSchema, input);
    const folder = await prisma.mediaFolder.create({
      data: { name: data.name, parentId: data.parentId ?? null },
    });
    await recordActivity({ actorId: user.id, action: 'media.folder.create', targetType: 'MediaFolder', targetId: folder.id });
    return { ok: true, data: { id: folder.id } };
  } catch (error) {
    return toActionError(error);
  }
}

// Errors from every action in this module are mapped via the shared
// toActionError helper (see individual catch blocks above).
