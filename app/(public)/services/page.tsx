import type { Metadata } from 'next';
import Link from 'next/link';
import { resolveMetadata } from '@/lib/services/seo-service';
import { getPublicServices } from '@/lib/services/public-content-service';

// Reads live CMS data (services) on every request — must not be statically
// prerendered at build time.
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const r = await resolveMetadata('/services');
  return { title: r.title, description: r.description || undefined };
}

export default async function ServicesPage(): Promise<React.ReactElement> {
  const services = await getPublicServices();
  return (
    <main id="main-content" className="mx-auto max-w-content-xl px-5 py-24 lg:px-8">
      <h1 className="font-display text-h1 font-bold text-[color:var(--color-text-primary)]">
        Services
      </h1>
      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((s) => (
          <Link
            key={s.id}
            href={`/services/${s.slug}`}
            className="rounded-lg border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] p-6 hover:border-[color:var(--color-brand-primary)]"
          >
            <h2 className="text-h4 font-semibold text-[color:var(--color-text-primary)]">
              {s.name}
            </h2>
            <p className="mt-2 text-small text-[color:var(--color-text-muted)]">{s.shortBenefit}</p>
          </Link>
        ))}
      </div>
    </main>
  );
}
