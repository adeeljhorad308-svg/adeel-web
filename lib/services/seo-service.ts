import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { requirePermission } from '@/lib/auth/guards';
import { parseOrThrow } from '@/lib/validation';
import { globalSeoConfigSchema, seoOverrideSchema } from '@/lib/validation/seo';
import { recordActivity } from '@/lib/logging/activity';
import { toActionError } from '@/lib/services/action-result';
import type { ActionResult } from '@/lib/types';
import type { GlobalSeoConfig, SeoOverride } from '@prisma/client';

/**
 * SEO Manager service (Stage 4 §14).
 *
 * `resolveMetadata` is the public-facing half of this module: every page's
 * `generateMetadata` calls it to get the effective title/description, applying
 * per-page overrides on top of the global defaults with no code required to
 * change any of it. It requires no auth (metadata resolution runs for every
 * visitor); only the admin read/write functions below are permission-gated.
 */

export async function getGlobalSeoConfig(): Promise<ActionResult<GlobalSeoConfig | null>> {
  try {
    await requirePermission('SEO', 'VIEW');
    const config = await prisma.globalSeoConfig.findFirst();
    return { ok: true, data: config };
  } catch (error) {
    return toActionError(error);
  }
}

export async function saveGlobalSeoConfig(input: unknown): Promise<ActionResult<GlobalSeoConfig>> {
  try {
    const user = await requirePermission('SEO', 'EDIT');
    const data = parseOrThrow(globalSeoConfigSchema, input);
    const payload = {
      defaultTitle: data.defaultTitle,
      titleTemplate: data.titleTemplate,
      defaultDescription: data.defaultDescription,
      defaultOgImageId: data.defaultOgImageId ?? null,
      twitterHandle: data.twitterHandle ?? null,
      robotsExtra: data.robotsExtra ?? null,
    };

    const existing = await prisma.globalSeoConfig.findFirst();
    const config = existing
      ? await prisma.globalSeoConfig.update({ where: { id: existing.id }, data: payload })
      : await prisma.globalSeoConfig.create({ data: payload });

    await recordActivity({ actorId: user.id, action: 'seo.global.update', targetType: 'GlobalSeoConfig', targetId: config.id });
    return { ok: true, data: config };
  } catch (error) {
    return toActionError(error);
  }
}

export async function listSeoOverrides(): Promise<ActionResult<SeoOverride[]>> {
  try {
    await requirePermission('SEO', 'VIEW');
    const overrides = await prisma.seoOverride.findMany({ orderBy: { pagePath: 'asc' } });
    return { ok: true, data: overrides };
  } catch (error) {
    return toActionError(error);
  }
}

export async function saveSeoOverride(input: unknown): Promise<ActionResult<SeoOverride>> {
  try {
    const user = await requirePermission('SEO', 'EDIT');
    const data = parseOrThrow(seoOverrideSchema, input);
    const payload = {
      pagePath: data.pagePath,
      title: data.title ?? null,
      description: data.description ?? null,
      ogImageId: data.ogImageId ?? null,
      canonicalUrl: data.canonicalUrl ?? null,
      noindex: data.noindex,
    };

    const override = await prisma.seoOverride.upsert({
      where: { pagePath: data.pagePath },
      create: payload,
      update: payload,
    });

    await recordActivity({ actorId: user.id, action: 'seo.override.update', targetType: 'SeoOverride', targetId: override.id });
    return { ok: true, data: override };
  } catch (error) {
    return toActionError(error);
  }
}

export async function deleteSeoOverride(pagePath: string): Promise<ActionResult<{ deleted: true }>> {
  try {
    const user = await requirePermission('SEO', 'DELETE');
    await prisma.seoOverride.delete({ where: { pagePath } });
    await recordActivity({ actorId: user.id, action: 'seo.override.delete', targetType: 'SeoOverride' });
    return { ok: true, data: { deleted: true } };
  } catch (error) {
    return toActionError(error);
  }
}

/**
 * Resolve effective metadata for a given path. No auth required — called from
 * every public page's `generateMetadata`. Falls back through: override → global
 * default → hard-coded safety net (never returns an empty title).
 */
export async function resolveMetadata(pagePath: string): Promise<{
  title: string;
  description: string;
  noindex: boolean;
  canonicalUrl?: string;
}> {
  const [override, global] = await Promise.all([
    prisma.seoOverride.findUnique({ where: { pagePath } }),
    prisma.globalSeoConfig.findFirst(),
  ]);

  const defaultTitle = global?.defaultTitle ?? 'Adeel IT Solutions';
  const defaultDescription = global?.defaultDescription ?? '';

  return {
    title: override?.title ?? defaultTitle,
    description: override?.description ?? defaultDescription,
    noindex: override?.noindex ?? false,
    ...(override?.canonicalUrl ? { canonicalUrl: override.canonicalUrl } : {}),
  };
}
