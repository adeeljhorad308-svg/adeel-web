import type { Metadata } from 'next';
import { resolveMetadata } from '@/lib/services/seo-service';
import { getCompanySettingsPublic } from '@/lib/services/public-content-service';
import { ContactForm } from '@/components/public/contact-form';

// Reads live CMS data (company settings) on every request — must not be
// statically prerendered at build time.
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const resolved = await resolveMetadata('/contact');
  return { title: resolved.title, description: resolved.description || undefined };
}

/** Contact page (Stage 3 Page 11). */
export default async function ContactPage(): Promise<React.ReactElement> {
  const company = await getCompanySettingsPublic();
  const phone = company.phone as string | undefined;
  const email = company.email as string | undefined;
  const address = company.address as string | undefined;

  return (
    <main id="main-content" className="mx-auto max-w-content-xl px-5 py-24 lg:px-8">
      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h1 className="font-display text-h1 font-bold text-[color:var(--color-text-primary)]">
            Get in touch
          </h1>
          <p className="mt-4 text-body-lg text-[color:var(--color-text-muted)]">
            Tell us about your project — we reply within 24 hours.
          </p>
          <div className="mt-8 flex flex-col gap-3 text-body text-[color:var(--color-text-body)]">
            {email && <p>Email: {email}</p>}
            {phone && <p>Phone: {phone}</p>}
            {address && <p>{address}</p>}
          </div>
        </div>
        <div className="lg:col-span-7">
          <ContactForm />
        </div>
      </div>
    </main>
  );
}
