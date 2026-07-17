import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { resolveMetadata } from '@/lib/services/seo-service';
import { getPublicIndustryBySlug } from '@/lib/services/public-content-service';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const r = await resolveMetadata(`/industries/${slug}`);
  return { title: r.title, description: r.description || undefined };
}

export default async function IndustryDetailPage({ params }: { params: Promise<{ slug: string }> }): Promise<React.ReactElement> {
  const { slug } = await params;
  const industry = await getPublicIndustryBySlug(slug);
  if (!industry) notFound();

  return (
    <main id="main-content" className="mx-auto max-w-content-xl px-5 py-24 lg:px-8">
      <h1 className="font-display text-h1 font-bold text-[color:var(--color-text-primary)]">{industry.name}</h1>
      {industry.tagline && <p className="mt-4 max-w-2xl text-body-lg text-[color:var(--color-text-muted)]">{industry.tagline}</p>}
      {industry.challenges.length > 0 && (
        <div className="mt-12">
          <h2 className="font-display text-h2 font-bold text-[color:var(--color-text-primary)]">Common challenges</h2>
          <ul className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            {industry.challenges.map((c) => <li key={c.id} className="rounded-lg border border-[color:var(--color-border-default)] p-4 text-body">{c.label}</li>)}
          </ul>
        </div>
      )}
      {industry.faqs.length > 0 && (
        <div className="mt-16 max-w-[760px]">
          <h2 className="font-display text-h2 font-bold text-[color:var(--color-text-primary)]">FAQs</h2>
          {industry.faqs.map((f) => (
            <details key={f.id} className="mt-4 border-b border-[color:var(--color-border-default)] pb-4">
              <summary className="cursor-pointer text-body font-semibold">{f.question}</summary>
              <p className="mt-2 text-body text-[color:var(--color-text-muted)]">{f.answer}</p>
            </details>
          ))}
        </div>
      )}
    </main>
  );
}
