import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { resolveMetadata } from '@/lib/services/seo-service';
import { getPublicPostBySlug } from '@/lib/services/public-content-service';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const r = await resolveMetadata(`/blog/${slug}`);
  return { title: r.title, description: r.description || undefined };
}

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<React.ReactElement> {
  const { slug } = await params;
  const post = await getPublicPostBySlug(slug);
  if (!post) notFound();

  return (
    <main id="main-content" className="mx-auto max-w-[760px] px-5 py-24">
      {post.category && (
        <span className="text-overline font-semibold uppercase text-[color:var(--color-brand-primary)]">
          {post.category.name}
        </span>
      )}
      <h1 className="mt-2 font-display text-h1 font-bold text-[color:var(--color-text-primary)]">
        {post.title}
      </h1>
      <p className="mt-3 text-small text-[color:var(--color-text-muted)]">
        {post.author?.name ?? 'Adeel IT Solutions'} · {post.readingTime} min read
      </p>
      <div
        className="prose mt-8 text-body-lg text-[color:var(--color-text-body)]"
        dangerouslySetInnerHTML={{ __html: post.contentRich }}
      />
    </main>
  );
}
