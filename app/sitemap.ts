import type { MetadataRoute } from 'next';
import { clientEnv } from '@/lib/config/env';

const routes = [
  { path: '', changeFrequency: 'weekly' as const, priority: 1 },
  { path: '/services', changeFrequency: 'weekly' as const, priority: 0.9 },
  { path: '/industries', changeFrequency: 'weekly' as const, priority: 0.8 },
  { path: '/work', changeFrequency: 'weekly' as const, priority: 0.9 },
  { path: '/about', changeFrequency: 'monthly' as const, priority: 0.6 },
  { path: '/team', changeFrequency: 'monthly' as const, priority: 0.5 },
  { path: '/blog', changeFrequency: 'daily' as const, priority: 0.8 },
  { path: '/contact', changeFrequency: 'monthly' as const, priority: 0.7 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map(({ path, changeFrequency, priority }) => ({
    url: `${clientEnv.NEXT_PUBLIC_APP_URL}${path}`,
    changeFrequency,
    priority,
  }));
}
