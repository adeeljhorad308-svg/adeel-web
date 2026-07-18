import type { Metadata } from 'next';
import { APP_NAME } from '@/lib/constants';
import { resolveMetadata } from '@/lib/services/seo-service';
import {
  getPublicServices,
  getPublicIndustries,
  getFeaturedProjects,
  getPublicTestimonials,
  getPublicFaqs,
  getCompanySettingsPublic,
} from '@/lib/services/public-content-service';
import {
  HeroSection,
  TrustBand,
  ServicesSection,
  IndustriesSection,
  FeaturedWorkSection,
  TestimonialsSection,
  FaqSection,
  CtaBand,
} from '@/components/public/homepage-sections';

/**
 * Homepage (Stage 2 — CMS-driven assembly). Every section fetches real data in
 * parallel and renders nothing when its content is empty (Stage 2/3 honesty
 * contract) — this page never fabricates services, industries, projects,
 * testimonials, or FAQs. A fresh install therefore shows Hero + CTA only, with
 * every other section appearing as an admin publishes real content.
 *
 * Metadata is resolved through the SEO Manager (global defaults + any override
 * for "/"), so an admin can change the homepage title/description without a
 * deploy.
 *
 * `force-dynamic`: this page reads live CMS/content data from the database on
 * every request (services, industries, testimonials, etc. are editable from
 * the admin without a redeploy), so it must never be statically prerendered
 * at build time — doing so would either require a live database during
 * `next build` or bake in stale/build-time content. Runtime DB access is
 * otherwise unchanged.
 */
export const dynamic = 'force-dynamic';

export async function generateMetadata(): Promise<Metadata> {
  const resolved = await resolveMetadata('/');
  return {
    title: resolved.title,
    description: resolved.description || undefined,
    robots: resolved.noindex ? { index: false, follow: false } : undefined,
    ...(resolved.canonicalUrl ? { alternates: { canonical: resolved.canonicalUrl } } : {}),
  };
}

export default async function HomePage(): Promise<React.ReactElement> {
  const [services, industries, projects, testimonials, faqs, company] = await Promise.all([
    getPublicServices(),
    getPublicIndustries(),
    getFeaturedProjects(4),
    getPublicTestimonials(6),
    getPublicFaqs(),
    getCompanySettingsPublic(),
  ]);

  const companyName = (company.name as string | undefined) ?? APP_NAME;

  return (
    <main id="main-content">
      <HeroSection companyName={companyName} />
      <TrustBand hasContent={testimonials.length > 0} />
      <ServicesSection services={services} />
      <IndustriesSection industries={industries} />
      <FeaturedWorkSection projects={projects} />
      <TestimonialsSection testimonials={testimonials} />
      <FaqSection faqs={faqs} />
      <CtaBand />
    </main>
  );
}
