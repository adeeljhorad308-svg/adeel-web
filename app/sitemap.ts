import type { MetadataRoute } from 'next';

/**
 * Basic sitemap.xml to prevent build failures when DB/env is unavailable.
 * In production with full env, this can be made fully dynamic again.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000');

  return [
    { url: base, changeFrequency: 'weekly', priority: 1 },
    { url: `${base}/services`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/industries`, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${base}/work`, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${base}/about`, changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/team`, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${base}/blog`, changeFrequency: 'daily', priority: 0.8 },
    { url: `${base}/contact`, changeFrequency: 'monthly', priority: 0.7 },
  ];
}
