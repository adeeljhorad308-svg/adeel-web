import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { resolveMetadata } from '@/lib/services/seo-service';
import { getPublicServiceBySlug } from '@/lib/services/public-content-service';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const r = await resolveMetadata(`/services/${slug}`);
  return { title: r.title, description: r.description || undefined };
}

export default async function ServiceDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<React.ReactElement> {
  const { slug } = await params;
  const service = await getPublicServiceBySlug(slug);
  if (!service) notFound();

  return (
    <main id="main-content" className="mx-auto max-w-content-xl px-5 py-24 lg:px-8">
      <p className="text-overline font-semibold uppercase text-[color:var(--color-brand-primary)]">
        Service
      </p>
      <h1 className="mt-2 font-display text-h1 font-bold text-[color:var(--color-text-primary)]">
        {service.name}
      </h1>
      <p className="mt-4 max-w-2xl text-body-lg text-[color:var(--color-text-muted)]">
        {service.shortBenefit}
      </p>
      {service.descriptionRich && (
        <div
          className="prose mt-8 max-w-2xl text-body"
          dangerouslySetInnerHTML={{ __html: service.descriptionRich }}
        />
      )}
      {service.benefits.length > 0 && (
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {service.benefits.map((b) => (
            <div key={b.id}>
              <h3 className="text-h4 font-semibold text-[color:var(--color-text-primary)]">
                {b.claim}
              </h3>
              {b.proof && (
                <p className="mt-1 text-small text-[color:var(--color-text-muted)]">{b.proof}</p>
              )}
            </div>
          ))}
        </div>
      )}
      {service.faqs.length > 0 && (
        <div className="mt-16 max-w-[760px]">
          <h2 className="font-display text-h2 font-bold text-[color:var(--color-text-primary)]">
            FAQs
          </h2>
          {service.faqs.map((f) => (
            <details
              key={f.id}
              className="mt-4 border-b border-[color:var(--color-border-default)] pb-4"
            >
              <summary className="cursor-pointer text-body font-semibold">{f.question}</summary>
              <div
                className="mt-2 text-body text-[color:var(--color-text-muted)]"
                dangerouslySetInnerHTML={{ __html: f.answer }}
              />
            </details>
          ))}
        </div>
      )}
    </main>
  );
}
