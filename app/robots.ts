import type { MetadataRoute } from 'next';

/**
 * robots.txt configuration.
 * Simplified to avoid build-time environment validation errors
 * and satisfy @typescript-eslint/require-await.
 */
export default function robots(): MetadataRoute.Robots {
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
