import type { MetadataRoute } from 'next';

/**
 * Dynamic robots.txt.
 * Gracefully handles missing environment variables during build
 * (common when running `next build` locally without a full .env file).
 */
export default async function robots(): Promise<MetadataRoute.Robots> {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000');

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/api', '/login', '/forgot-password', '/reset-password', '/verify-email', '/2fa'],
    },
    sitemap: `${base}/sitemap.xml`,
  };
}
