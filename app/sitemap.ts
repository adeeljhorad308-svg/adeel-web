import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/db/prisma';
import { clientEnv } from '@/lib/config/env';

/**
 * Dynamic sitemap.xml (Stage 4 §14; Master Spec SEO). Generated from real
 * published content only — draft/unpublished/archived records never appear.
 * Next.js serves this at /sitemap.xml automatically from this file's default export.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = clientEnv.NEXT_PUBLIC_APP_URL;

  const [services, industries, projects, posts] = await Promise.all([
    prisma.service.findMany({ where: { visible: true, deletedAt: null }, select: { slug: true, updatedAt: true } }),
    prisma.industry.findMany({ where: { visible: true, deletedAt: null }, select: { slug: true, updatedAt: true } }),
    prisma.project.findMany({ where: { status: 'PUBLISHED', deletedAt: null }, select: { slug: true, updatedAt: true } }),
    prisma.post.findMany({ where: { status: 'PUBLISHED', deletedAt: null }, select: { slug: true, updatedAt: true } }),
  ]);

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: base, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/services`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/industries`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/work`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/about`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/team`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/blog`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/contact`, changeFrequency: 'monthly', priority: 0.7 },
  ];

  return [
    ...staticRoutes,
    ...services.map((s) => ({ url: `${base}/services/${s.slug}`, lastModified: s.updatedAt, changeFrequency: 'monthly' as const, priority: 0.7 })),
    ...industries.map((i) => ({ url: `${base}/industries/${i.slug}`, lastModified: i.updatedAt, changeFrequency: 'monthly' as const, priority: 0.6 })),
    ...projects.map((p) => ({ url: `${base}/work/${p.slug}`, lastModified: p.updatedAt, changeFrequency: 'monthly' as const, priority: 0.7 })),
    ...posts.map((p) => ({ url: `${base}/blog/${p.slug}`, lastModified: p.updatedAt, changeFrequency: 'yearly' as const, priority: 0.5 })),
  ];
}
