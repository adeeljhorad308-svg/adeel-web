import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { logger } from '@/lib/logging/logger';

/**
 * Public content service (Stage 3 homepage + pages).
 *
 * Deliberately separate from the admin services in lib/services/*-service.ts:
 * these functions require NO authentication (they back the public website) and
 * enforce publication/visibility filters unconditionally — there is no code path
 * here that can return a draft, hidden, or soft-deleted record, regardless of who
 * calls it. This is the honesty boundary from Stage 2/3: sections hide when
 * empty rather than ever fabricating or leaking unpublished content.
 *
 * No RBAC guard is needed here (there is no permission to check for anonymous
 * visitors), but every query below hard-codes its publication filter rather than
 * accepting one as a parameter, so a caller cannot accidentally request drafts.
 *
 * Return types are intentionally left to Prisma's inference (not hand-annotated)
 * because each function's `include` shape is nested and specific to it; a
 * hand-written interface would duplicate the Prisma-generated shape and drift the
 * moment a query changes. Callers should destructure what they need rather than
 * relying on a named exported type.
 */

export async function getPublicServices() {
  return prisma.service.findMany({
    where: { visible: true, deletedAt: null },
    orderBy: { order: 'asc' },
    include: { features: true, benefits: true, processSteps: true, faqs: true },
  });
}

export async function getPublicServiceBySlug(slug: string) {
  return prisma.service.findFirst({
    where: { slug, visible: true, deletedAt: null },
    include: { features: true, benefits: true, processSteps: true, faqs: true },
  });
}

export async function getPublicIndustries() {
  return prisma.industry.findMany({
    where: { visible: true, deletedAt: null },
    orderBy: { order: 'asc' },
  });
}

export async function getPublicIndustryBySlug(slug: string) {
  return prisma.industry.findFirst({
    where: { slug, visible: true, deletedAt: null },
    include: { challenges: true, solutionMappings: true, faqs: true },
  });
}

export async function getFeaturedProjects(limit = 4) {
  return prisma.project.findMany({
    where: { status: 'PUBLISHED', featured: true, deletedAt: null },
    orderBy: { order: 'asc' },
    take: limit,
    include: { media: { orderBy: { order: 'asc' }, include: { media: true } }, category: true },
  });
}

export async function getPublicProjects(page = 1, pageSize = 12) {
  const where = { status: 'PUBLISHED' as const, deletedAt: null };
  const [items, total] = await Promise.all([
    prisma.project.findMany({
      where,
      orderBy: [{ featured: 'desc' }, { order: 'asc' }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: { media: { orderBy: { order: 'asc' }, include: { media: true } }, category: true },
    }),
    prisma.project.count({ where }),
  ]);
  return { items, total, page, pageSize };
}

export async function getPublicProjectBySlug(slug: string) {
  return prisma.project.findFirst({
    where: { slug, status: 'PUBLISHED', deletedAt: null },
    include: {
      narratives: { orderBy: { order: 'asc' } },
      metrics: { orderBy: { order: 'asc' } },
      media: { orderBy: { order: 'asc' }, include: { media: true } },
      technologies: { include: { technology: true } },
      category: true,
    },
  });
}

export async function getPublicTeam() {
  return prisma.teamMember.findMany({
    where: { active: true, deletedAt: null },
    orderBy: { order: 'asc' },
    include: { skills: { orderBy: { order: 'asc' } }, socialLinks: { where: { visible: true } } },
  });
}

/** Only ever returns testimonials an admin explicitly published. Never fabricated. */
export async function getPublicTestimonials(limit?: number) {
  return prisma.testimonial.findMany({
    where: { status: 'PUBLISHED', deletedAt: null },
    orderBy: { order: 'asc' },
    ...(limit !== undefined ? { take: limit } : {}),
  });
}

export async function getPublicFaqs() {
  return prisma.globalFaq.findMany({ where: { visible: true }, orderBy: { order: 'asc' } });
}

export async function getPublicPosts(page = 1, pageSize = 9) {
  const where = { status: 'PUBLISHED' as const, deletedAt: null };
  const [items, total] = await Promise.all([
    prisma.post.findMany({
      where,
      orderBy: { publishedAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        category: true,
        tags: { include: { tag: true } },
        author: { select: { name: true } },
      },
    }),
    prisma.post.count({ where }),
  ]);
  return { items, total, page, pageSize };
}

export async function getFeaturedPost() {
  return prisma.post.findFirst({
    where: { status: 'PUBLISHED', featured: true, deletedAt: null },
    orderBy: { publishedAt: 'desc' },
    include: { category: true, author: { select: { name: true } } },
  });
}

export async function getPublicPostBySlug(slug: string) {
  return prisma.post.findFirst({
    where: { slug, status: 'PUBLISHED', deletedAt: null },
    include: {
      category: true,
      tags: { include: { tag: true } },
      author: { select: { name: true } },
      relatedTo: { include: { relatedPost: true } },
    },
  });
}

export async function getCompanySettingsPublic(): Promise<Record<string, unknown>> {
  const rows = await prisma.setting.findMany({ where: { group: 'company' } });
  return Object.fromEntries(rows.map((r) => [r.key, r.value]));
}

export async function getSocialLinksPublic(): Promise<Array<{ platform: string; url: string }>> {
  const row = await prisma.setting.findUnique({
    where: { group_key: { group: 'social', key: 'links' } },
  });
  const links =
    (row?.value as Array<{ platform: string; url: string; visible: boolean }> | undefined) ?? [];
  // Hard filter: hidden or empty-URL entries never reach the public site
  // (Stage 2/3 contract — every social icon opens the correct URL, or is absent).
  return links.filter((l) => l.visible && l.url.trim() !== '');
}

export async function getAnalyticsSettingsPublic(): Promise<{
  gaId?: string | undefined;
  gtmId?: string | undefined;
}> {
  // This is called from the root layout, so it runs on every single page
  // (including the error and not-found pages). A transient database outage
  // must not take the whole site down over optional analytics IDs.
  try {
    const rows = await prisma.setting.findMany({ where: { group: 'analytics' } });
    const map = Object.fromEntries(rows.map((r) => [r.key, r.value])) as Record<string, unknown>;
    return {
      gaId: typeof map.gaId === 'string' ? map.gaId : undefined,
      gtmId: typeof map.gtmId === 'string' ? map.gtmId : undefined,
    };
  } catch (error) {
    logger.error({ err: error }, 'Failed to load analytics settings; continuing without them');
    return {};
  }
}
