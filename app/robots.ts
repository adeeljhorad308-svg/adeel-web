import type { MetadataRoute } from 'next';
import { clientEnv } from '@/lib/config/env';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/api',
        '/login',
        '/forgot-password',
        '/reset-password',
        '/verify-email',
        '/2fa',
      ],
    },
    sitemap: `${clientEnv.NEXT_PUBLIC_APP_URL}/sitemap.xml`,
  };
}
