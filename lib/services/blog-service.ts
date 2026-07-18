import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { requirePermission } from '@/lib/auth/guards';
import { parseOrThrow } from '@/lib/validation';
import { postListSchema, upsertPostSchema, type PostListInput } from '@/lib/validation/blog';
import { sanitizeRichText } from '@/lib/security/sanitize';
import { estimateReadingTime } from '@/lib/utils';
import { recordActivity } from '@/lib/logging/activity';
import { toActionError } from '@/lib/services/action-result';
import { ConflictError } from '@/lib/errors';
import type { ActionResult, Paginated } from '@/lib/types';
import type { Post, Prisma } from '@prisma/client';

/**
 * Blog CMS service (Stage 4 §7). Reading time is always computed server-side
 * from sanitized content on save (never trusted from the client), with an
 * optional admin override for edge cases. Scheduled posts are validated to have
 * a future `scheduledAt`; the actual status flip from SCHEDULED → PUBLISHED at
 * the scheduled time happens in the scheduled-publish Trigger.dev job (Phase 0
 * scaffold, wired to real logic in this phase — see publishDuePosts below).
 */

async function nextVersionNumber(tx: Prisma.TransactionClient, postId: string): Promise<number> {
  const last = await tx.contentVersion.findFirst({
    where: { entity: 'POST', entityId: postId },
    orderBy: { versionNo: 'desc' },
    select: { versionNo: true },
  });
  return (last?.versionNo ?? 0) + 1;
}

export async function listPosts(input: PostListInput): Promise<ActionResult<Paginated<Post>>> {
  try {
    await requirePermission('BLOG', 'VIEW');
    const { page, pageSize, status, categoryId, tagId, search } = parseOrThrow(
      postListSchema,
      input,
    );

    const where: Prisma.PostWhereInput = {
      deletedAt: null,
      ...(status !== undefined ? { status } : {}),
      ...(categoryId !== undefined ? { categoryId } : {}),
      ...(tagId !== undefined ? { tags: { some: { tagId } } } : {}),
      ...(search ? { title: { contains: search, mode: 'insensitive' } } : {}),
    };

    const [items, total] = await Promise.all([
      prisma.post.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.post.count({ where }),
    ]);

    return { ok: true, data: { items, total, page, pageSize } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function getPost(id: string): Promise<ActionResult<Post | null>> {
  try {
    await requirePermission('BLOG', 'VIEW');
    const post = await prisma.post.findFirst({
      where: { id, deletedAt: null },
      include: { tags: true },
    });
    return { ok: true, data: post };
  } catch (error) {
    return toActionError(error);
  }
}

export async function upsertPost(input: unknown): Promise<ActionResult<Post>> {
  try {
    const data = parseOrThrow(upsertPostSchema, input);
    const user = await requirePermission('BLOG', data.id ? 'EDIT' : 'CREATE');

    const sanitizedContent = sanitizeRichText(data.contentRich);
    const readingTime = data.readingTimeOverride ?? estimateReadingTime(sanitizedContent);

    // Auto-set publishedAt when a post transitions to PUBLISHED and had none yet.
    const baseData = {
      title: data.title,
      slug: data.slug,
      excerpt: data.excerpt ?? null,
      coverImageId: data.coverImageId ?? null,
      contentRich: sanitizedContent,
      categoryId: data.categoryId ?? null,
      authorId: data.authorId ?? user.id,
      status: data.status,
      scheduledAt: data.status === 'SCHEDULED' ? (data.scheduledAt ?? null) : null,
      readingTime,
      featured: data.featured,
      seoTitle: data.seoTitle ?? null,
      seoDescription: data.seoDescription ?? null,
      ogImageId: data.ogImageId ?? null,
      canonicalUrl: data.canonicalUrl ?? null,
    };

    const result = await prisma.$transaction(async (tx) => {
      let post: Post;

      if (data.id) {
        const current = await tx.post.findUniqueOrThrow({ where: { id: data.id } });
        if (current.version !== data.version) throw new ConflictError();

        const publishedAt =
          data.status === 'PUBLISHED' && !current.publishedAt ? new Date() : current.publishedAt;

        post = await tx.post.update({
          where: { id: data.id },
          data: { ...baseData, publishedAt, version: { increment: 1 } },
        });

        await tx.postTag.deleteMany({ where: { postId: post.id } });
        await tx.postRelated.deleteMany({ where: { postId: post.id } });
      } else {
        post = await tx.post.create({
          data: {
            ...baseData,
            publishedAt: data.status === 'PUBLISHED' ? new Date() : null,
          },
        });
      }

      if (data.tagIds.length > 0) {
        await tx.postTag.createMany({
          data: data.tagIds.map((tagId) => ({ postId: post.id, tagId })),
        });
      }
      if (data.relatedPostIds.length > 0) {
        await tx.postRelated.createMany({
          data: data.relatedPostIds.map((relatedPostId) => ({ postId: post.id, relatedPostId })),
        });
      }

      const versionNo = await nextVersionNumber(tx, post.id);
      await tx.contentVersion.create({
        data: {
          entity: 'POST',
          entityId: post.id,
          versionNo,
          snapshot: data as unknown as Prisma.InputJsonValue,
          authorId: user.id,
        },
      });

      await recordActivity(
        {
          actorId: user.id,
          action: data.id ? 'blog.post.update' : 'blog.post.create',
          targetType: 'Post',
          targetId: post.id,
          metadata: { status: post.status },
        },
        tx,
      );

      return post;
    });

    return { ok: true, data: result };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deletePost(id: string): Promise<ActionResult<{ deleted: true }>> {
  try {
    const user = await requirePermission('BLOG', 'DELETE');
    await prisma.post.update({ where: { id }, data: { deletedAt: new Date() } });
    await recordActivity({
      actorId: user.id,
      action: 'blog.post.delete',
      targetType: 'Post',
      targetId: id,
    });
    return { ok: true, data: { deleted: true } };
  } catch (error) {
    return toActionError(error);
  }
}

/**
 * Publish all posts whose scheduled time has arrived. Called by the
 * scheduled-publish Trigger.dev task (lock-protected there). Not permission
 * gated — it is invoked by the job runner, not a user request.
 */
export async function publishDuePosts(): Promise<{ publishedCount: number }> {
  const due = await prisma.post.findMany({
    where: { status: 'SCHEDULED', scheduledAt: { lte: new Date() }, deletedAt: null },
    select: { id: true },
  });

  if (due.length === 0) return { publishedCount: 0 };

  await prisma.$transaction(
    due.map((post) =>
      prisma.post.update({
        where: { id: post.id },
        data: { status: 'PUBLISHED', publishedAt: new Date() },
      }),
    ),
  );

  for (const post of due) {
    await recordActivity({
      action: 'blog.post.auto_publish',
      targetType: 'Post',
      targetId: post.id,
    });
  }

  return { publishedCount: due.length };
}
