import type { Metadata } from 'next';
import Link from 'next/link';
import { resolveMetadata } from '@/lib/services/seo-service';
import { getPublicPosts } from '@/lib/services/public-content-service';

export async function generateMetadata(): Promise<Metadata> {
  const r = await resolveMetadata('/blog');
  return { title: r.title, description: r.description || undefined };
}

export default async function BlogPage(): Promise<React.ReactElement> {
  const { items } = await getPublicPosts(1, 9);
  return (
    <main id="main-content" className="mx-auto max-w-content-xl px-5 py-24 lg:px-8">
      <h1 className="font-display text-h1 font-bold text-[color:var(--color-text-primary)]">Blog</h1>
      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((p) => (
          <Link key={p.id} href={`/blog/${p.slug}`} className="rounded-lg border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] p-6 hover:border-[color:var(--color-brand-primary)]">
            {p.category && <span className="text-overline font-semibold uppercase text-[color:var(--color-brand-primary)]">{p.category.name}</span>}
            <h2 className="mt-2 text-h4 font-semibold text-[color:var(--color-text-primary)]">{p.title}</h2>
            {p.excerpt && <p className="mt-2 text-small text-[color:var(--color-text-muted)]">{p.excerpt}</p>}
            <p className="mt-3 text-overline text-[color:var(--color-text-muted)]">{p.readingTime} min read</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
