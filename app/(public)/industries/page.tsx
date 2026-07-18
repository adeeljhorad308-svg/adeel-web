import type { Metadata } from 'next';
import Link from 'next/link';
import { resolveMetadata } from '@/lib/services/seo-service';
import { getPublicIndustries } from '@/lib/services/public-content-service';

export async function generateMetadata(): Promise<Metadata> {
  const r = await resolveMetadata('/industries');
  return { title: r.title, description: r.description || undefined };
}

export default async function IndustriesPage(): Promise<React.ReactElement> {
  const industries = await getPublicIndustries();
  return (
    <main id="main-content" className="mx-auto max-w-content-xl px-5 py-24 lg:px-8">
      <h1 className="font-display text-h1 font-bold text-[color:var(--color-text-primary)]">
        Industries
      </h1>
      <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {industries.map((i) => (
          <Link
            key={i.id}
            href={`/industries/${i.slug}`}
            className="rounded-lg border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] p-5 text-center hover:border-[color:var(--color-brand-primary)]"
          >
            {i.name}
          </Link>
        ))}
      </div>
    </main>
  );
}
