import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/db/prisma';
import { clientEnv } from '@/lib/config/env';

/**
 * Dynamic robots.txt (Stage 4 §14). Disallows the admin and auth surfaces;
 * includes any extra directives an admin has configured in the SEO Manager.
 * Gracefully falls back to safe defaults if the database is unavailable during build.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const base = clientEnv.NEXT_PUBLIC_APP_URL;

  let config: { robotsExtra?: string | null } | null = null;

  try {
    config = await prisma.globalSeoConfig.findFirst();
  } catch {
    // Database unavailable during build (common in CI). Use safe defaults.
  }

  const robotsConfig: MetadataRoute.Robots = {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/login', '/forgot-password', '/reset-password', '/verify-email', '/2fa'],
    },
    sitemap: `${base}/sitemap.xml`,
  };

  if (config?.robotsExtra) {
    robotsConfig.host = base;
  }

  return robotsConfig;
}
