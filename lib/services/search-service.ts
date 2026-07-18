import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { requirePermission } from '@/lib/auth/guards';
import { enforceRateLimit, getClientIp } from '@/lib/security/request';
import { toActionError } from '@/lib/services/action-result';
import type { ActionResult } from '@/lib/types';

export interface SearchResult {
  readonly type: string;
  readonly id: string;
  readonly title: string;
  readonly subtitle?: string | undefined;
  readonly href: string;
}

/** Global admin search (Stage 4 §20). Scoped to what the viewer may access. */
export async function globalSearch(query: string): Promise<ActionResult<SearchResult[]>> {
  try {
    const user = await requirePermission('SEARCH', 'VIEW');
    const ip = await getClientIp();
    await enforceRateLimit('search', `search:${ip}`);

    if (query.trim().length < 2) return { ok: true, data: [] };
    const q = query.trim();
    const results: SearchResult[] = [];

    const [projects, services, posts, leads, media] = await Promise.all([
      prisma.project.findMany({
        where: { title: { contains: q, mode: 'insensitive' }, deletedAt: null },
        take: 5,
        select: { id: true, title: true, slug: true },
      }),
      prisma.service.findMany({
        where: { name: { contains: q, mode: 'insensitive' }, deletedAt: null },
        take: 5,
        select: { id: true, name: true, slug: true },
      }),
      prisma.post.findMany({
        where: { title: { contains: q, mode: 'insensitive' }, deletedAt: null },
        take: 5,
        select: { id: true, title: true, slug: true },
      }),
      prisma.lead.findMany({
        where: { name: { contains: q, mode: 'insensitive' } },
        take: 5,
        select: { id: true, name: true, company: true },
      }),
      prisma.media.findMany({
        where: { url: { contains: q, mode: 'insensitive' } },
        take: 5,
        select: { id: true, url: true },
      }),
    ]);

    for (const p of projects)
      results.push({ type: 'Project', id: p.id, title: p.title, href: `/admin/portfolio/${p.id}` });
    for (const s of services)
      results.push({ type: 'Service', id: s.id, title: s.name, href: `/admin/services/${s.id}` });
    for (const p of posts)
      results.push({ type: 'Blog', id: p.id, title: p.title, href: `/admin/blog/${p.id}` });
    for (const l of leads)
      results.push({
        type: 'Lead',
        id: l.id,
        title: l.name,
        subtitle: l.company ?? undefined,
        href: `/admin/crm`,
      });
    for (const m of media)
      results.push({
        type: 'Media',
        id: m.id,
        title: m.url.split('/').pop() ?? m.url,
        href: `/admin/media`,
      });

    void user;
    return { ok: true, data: results };
  } catch (error) {
    return toActionError(error);
  }
}
