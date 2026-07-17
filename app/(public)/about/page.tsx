import type { Metadata } from 'next';
import { resolveMetadata } from '@/lib/services/seo-service';
import { getCompanySettingsPublic, getPublicTeam } from '@/lib/services/public-content-service';

export async function generateMetadata(): Promise<Metadata> {
  const r = await resolveMetadata('/about');
  return { title: r.title, description: r.description || undefined };
}

export default async function AboutPage(): Promise<React.ReactElement> {
  const [company, team] = await Promise.all([getCompanySettingsPublic(), getPublicTeam()]);
  const name = (company.name as string | undefined) ?? 'Adeel IT Solutions';
  const tagline = company.tagline as string | undefined;

  return (
    <main id="main-content" className="mx-auto max-w-content-xl px-5 py-24 lg:px-8">
      <h1 className="font-display text-h1 font-bold text-[color:var(--color-text-primary)]">About {name}</h1>
      {tagline && <p className="mt-4 max-w-2xl text-body-lg text-[color:var(--color-text-muted)]">{tagline}</p>}
      {team.length > 0 && (
        <div className="mt-16">
          <h2 className="font-display text-h2 font-bold text-[color:var(--color-text-primary)]">Our team</h2>
          <div className="mt-8 grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4">
            {team.map((m) => (
              <div key={m.id} className="text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-[color:var(--color-brand-tint)] text-h4 font-semibold text-[color:var(--color-brand-primary)]">{m.name.charAt(0)}</div>
                <p className="mt-3 text-small font-semibold text-[color:var(--color-text-primary)]">{m.name}</p>
                <p className="text-overline text-[color:var(--color-text-muted)]">{m.designation}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </main>
  );
}
