import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { resolveMetadata } from '@/lib/services/seo-service';
import { getPublicProjects } from '@/lib/services/public-content-service';

export async function generateMetadata(): Promise<Metadata> {
  const r = await resolveMetadata('/work');
  return { title: r.title, description: r.description || undefined };
}

export default async function WorkPage(): Promise<React.ReactElement> {
  const { items } = await getPublicProjects(1, 12);
  return (
    <main id="main-content" className="mx-auto max-w-content-xl px-5 py-24 lg:px-8">
      <h1 className="font-display text-h1 font-bold text-[color:var(--color-text-primary)]">
        Our work
      </h1>
      <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
        {items.map((p) => {
          const cover = p.media.find((m) => m.isCover) ?? p.media[0];
          return (
            <Link
              key={p.id}
              href={`/work/${p.slug}`}
              className="overflow-hidden rounded-lg border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)]"
            >
              <div className="relative aspect-video bg-[color:var(--color-bg-subtle)]">
                {cover && (
                  <Image
                    src={cover.media.url}
                    alt={cover.media.altText ?? p.title}
                    fill
                    sizes="50vw"
                    className="object-cover"
                  />
                )}
              </div>
              <div className="p-5">
                <h2 className="text-h4 font-semibold text-[color:var(--color-text-primary)]">
                  {p.title}
                </h2>
              </div>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
