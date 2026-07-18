import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { resolveMetadata } from '@/lib/services/seo-service';
import { getPublicProjectBySlug } from '@/lib/services/public-content-service';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const r = await resolveMetadata(`/work/${slug}`);
  return { title: r.title, description: r.description || undefined };
}

export default async function CaseStudyPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<React.ReactElement> {
  const { slug } = await params;
  const project = await getPublicProjectBySlug(slug);
  if (!project) notFound();

  return (
    <main id="main-content" className="mx-auto max-w-content-xl px-5 py-24 lg:px-8">
      <h1 className="font-display text-h1 font-bold text-[color:var(--color-text-primary)]">
        {project.title}
      </h1>
      {project.clientName && (
        <p className="mt-2 text-body text-[color:var(--color-text-muted)]">
          Client: {project.clientName}
        </p>
      )}
      {project.overview && (
        <p className="mt-6 max-w-2xl text-body-lg text-[color:var(--color-text-muted)]">
          {project.overview}
        </p>
      )}
      {project.narratives.map((n) => (
        <div
          key={n.id}
          className="prose mt-10 max-w-2xl text-body"
          dangerouslySetInnerHTML={{ __html: n.bodyRich }}
        />
      ))}
      {project.metrics.length > 0 && (
        <div className="mt-12 grid grid-cols-2 gap-6 sm:grid-cols-3">
          {project.metrics.map((m) => (
            <div key={m.id}>
              <p className="font-display text-h2 font-bold text-[color:var(--color-brand-primary)]">
                {m.value}
              </p>
              <p className="text-small text-[color:var(--color-text-muted)]">{m.label}</p>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
