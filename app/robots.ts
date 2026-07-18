import type { MetadataRoute } from 'next';

/**
 * Static robots.txt to guarantee build success.
 * Dynamic version can be restored later when full env is available.
 */
const robots: MetadataRoute.Robots = {
  rules: {
    userAgent: '*',
    allow: '/',
    disallow: ['/admin', '/api', '/login', '/forgot-password', '/reset-password', '/verify-email', '/2fa'],
  },
  sitemap: 'http://localhost:3000/sitemap.xml',
};

export default robots;
