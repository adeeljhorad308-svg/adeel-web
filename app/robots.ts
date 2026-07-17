import type { MetadataRoute } from 'next';
import { prisma } from '@/lib/db/prisma';
import { clientEnv } from '@/lib/config/env';

/**
 * Dynamic robots.txt (Stage 4 §14). Disallows the admin and auth surfaces;
 * includes any extra directives an admin has configured in the SEO Manager.
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const config = await prisma.globalSeoConfig.findFirst();
  const base = clientEnv.NEXT_PUBLIC_APP_URL;

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/login', '/forgot-password', '/reset-password', '/verify-email', '/2fa'],
    },
    sitemap: `${base}/sitemap.xml`,
    ...(config?.robotsExtra ? { host: base } : {}),
  };
}
