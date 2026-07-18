import type { MetadataRoute } from 'next';

/**
 * Static sitemap to guarantee build success.
 */
const sitemap: MetadataRoute.Sitemap = [
  { url: 'http://localhost:3000', changeFrequency: 'weekly', priority: 1 },
  { url: 'http://localhost:3000/services', changeFrequency: 'weekly', priority: 0.9 },
  { url: 'http://localhost:3000/industries', changeFrequency: 'weekly', priority: 0.8 },
  { url: 'http://localhost:3000/work', changeFrequency: 'weekly', priority: 0.9 },
  { url: 'http://localhost:3000/about', changeFrequency: 'monthly', priority: 0.6 },
  { url: 'http://localhost:3000/team', changeFrequency: 'monthly', priority: 0.5 },
  { url: 'http://localhost:3000/blog', changeFrequency: 'daily', priority: 0.8 },
  { url: 'http://localhost:3000/contact', changeFrequency: 'monthly', priority: 0.7 },
];

export default sitemap;
