import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type {
  getPublicServices,
  getPublicIndustries,
  getFeaturedProjects,
  getPublicTestimonials,
  getPublicFaqs,
} from '@/lib/services/public-content-service';

/**
 * Homepage sections (Stage 2). Each section is Server-rendered and receives
 * already-fetched, already-filtered public data. Per the Stage 2/3 honesty
 * contract, every section that depends on admin-authored content returns `null`
 * (renders nothing) when that content is empty — never a placeholder, never
 * fabricated filler. The page composing these sections (app/(public)/page.tsx)
 * is responsible for the fetch; these components are pure presentation.
 */

type Services = Awaited<ReturnType<typeof getPublicServices>>;
type Industries = Awaited<ReturnType<typeof getPublicIndustries>>;
type Projects = Awaited<ReturnType<typeof getFeaturedProjects>>;
type Testimonials = Awaited<ReturnType<typeof getPublicTestimonials>>;
type Faqs = Awaited<ReturnType<typeof getPublicFaqs>>;

export function HeroSection({
  companyName,
}: {
  companyName: string;
}): React.ReactElement {
  return (
    <section className="relative overflow-hidden pt-24 sm:pt-32">
      <div className="mx-auto grid max-w-content-xl grid-cols-1 gap-10 px-5 lg:grid-cols-12 lg:items-center lg:gap-8 lg:px-8">
        <div className="lg:col-span-7">
          <p className="text-overline font-semibold uppercase tracking-wide text-[color:var(--color-brand-primary)]">
            Software Development · US · UK · Pakistan
          </p>
          <h1 className="mt-4 font-display text-display font-bold leading-tight text-[color:var(--color-text-primary)]">
            Premium software for serious businesses
          </h1>
          <p className="mt-5 max-w-xl text-body-lg text-[color:var(--color-text-muted)]">
            {companyName} builds websites, web applications, and custom software that help
            businesses launch faster and run smoother.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="inline-flex h-[52px] items-center justify-center gap-2 rounded-md bg-[color:var(--color-brand-primary)] px-6 text-body-lg font-medium text-white transition-colors hover:bg-[color:var(--color-brand-hover)]"
            >
              Start Your Project
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
            <Link
              href="/work"
              className="inline-flex h-[52px] items-center justify-center rounded-md border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] px-6 text-body-lg font-medium text-[color:var(--color-text-primary)] hover:border-[color:var(--color-brand-primary)]"
            >
              View Our Work
            </Link>
          </div>
        </div>
        <div className="lg:col-span-5">
          <div
            aria-hidden="true"
            className="aspect-square w-full rounded-xl"
            style={{ background: 'linear-gradient(135deg, var(--color-brand-primary), #6366F1)' }}
          />
        </div>
      </div>
    </section>
  );
}

/** Trust band. Hides entirely if no real client logos/stats exist — never a
 *  placeholder logo row (Stage 2 §2 honesty contract). */
export function TrustBand({ hasContent }: { hasContent: boolean }): React.ReactElement | null {
  if (!hasContent) return null;
  return (
    <section className="border-y border-[color:var(--color-border-default)] bg-[color:var(--color-bg-subtle)] py-8">
      <div className="mx-auto max-w-content-xl px-5 text-center lg:px-8">
        <p className="text-overline font-semibold uppercase text-[color:var(--color-text-muted)]">
          Trusted by businesses across the US, UK & Pakistan
        </p>
      </div>
    </section>
  );
}

export function ServicesSection({ services }: { services: Services }): React.ReactElement | null {
  if (services.length === 0) return null;
  return (
    <section className="py-24">
      <div className="mx-auto max-w-content-xl px-5 lg:px-8">
        <div className="max-w-2xl">
          <h2 className="font-display text-h2 font-bold text-[color:var(--color-text-primary)]">Services</h2>
          <p className="mt-3 text-body-lg text-[color:var(--color-text-muted)]">
            End-to-end software development for businesses of every size.
          </p>
        </div>
        <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {services.map((service) => (
            <Link
              key={service.id}
              href={`/services/${service.slug}`}
              className="group rounded-lg border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] p-6 transition-colors hover:border-[color:var(--color-brand-primary)]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-md bg-[color:var(--color-brand-tint)] text-[color:var(--color-brand-primary)]">
                <span className="text-small font-bold">{service.name.charAt(0)}</span>
              </div>
              <h3 className="mt-4 text-h4 font-semibold text-[color:var(--color-text-primary)] group-hover:text-[color:var(--color-brand-primary)]">
                {service.name}
              </h3>
              <p className="mt-2 text-small text-[color:var(--color-text-muted)]">{service.shortBenefit}</p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function IndustriesSection({ industries }: { industries: Industries }): React.ReactElement | null {
  if (industries.length === 0) return null;
  return (
    <section className="bg-[color:var(--color-bg-subtle)] py-24">
      <div className="mx-auto max-w-content-xl px-5 lg:px-8">
        <h2 className="font-display text-h2 font-bold text-[color:var(--color-text-primary)]">Industries we serve</h2>
        <div className="mt-10 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {industries.map((industry) => (
            <Link
              key={industry.id}
              href={`/industries/${industry.slug}`}
              className="group rounded-lg border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] p-5 text-center transition-colors hover:border-[color:var(--color-brand-primary)]"
            >
              <p className="text-small font-semibold text-[color:var(--color-text-primary)] group-hover:text-[color:var(--color-brand-primary)]">
                {industry.name}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FeaturedWorkSection({ projects }: { projects: Projects }): React.ReactElement | null {
  if (projects.length === 0) return null;
  return (
    <section className="py-24">
      <div className="mx-auto max-w-content-xl px-5 lg:px-8">
        <div className="flex items-end justify-between">
          <h2 className="font-display text-h2 font-bold text-[color:var(--color-text-primary)]">Featured work</h2>
          <Link href="/work" className="text-small font-medium text-[color:var(--color-brand-primary)] hover:underline">
            View all work
          </Link>
        </div>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {projects.map((project) => {
            const cover = project.media.find((m) => m.isCover) ?? project.media[0];
            return (
              <Link
                key={project.id}
                href={`/work/${project.slug}`}
                className="group overflow-hidden rounded-lg border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)]"
              >
                <div className="relative aspect-video bg-[color:var(--color-bg-subtle)]">
                  {cover && (
                    <Image
                      src={cover.media.url}
                      alt={cover.media.altText ?? project.title}
                      fill
                      sizes="(min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-base group-hover:scale-[1.03]"
                    />
                  )}
                </div>
                <div className="p-5">
                  {project.category && (
                    <span className="text-overline font-semibold uppercase text-[color:var(--color-brand-primary)]">
                      {project.category.name}
                    </span>
                  )}
                  <h3 className="mt-2 text-h4 font-semibold text-[color:var(--color-text-primary)] group-hover:text-[color:var(--color-brand-primary)]">
                    {project.title}
                  </h3>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/** Testimonials. Renders nothing if zero are published — never fake reviews. */
export function TestimonialsSection({ testimonials }: { testimonials: Testimonials }): React.ReactElement | null {
  if (testimonials.length === 0) return null;
  return (
    <section className="bg-[color:var(--color-bg-subtle)] py-24">
      <div className="mx-auto max-w-content-xl px-5 lg:px-8">
        <h2 className="font-display text-h2 font-bold text-[color:var(--color-text-primary)]">What clients say</h2>
        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((testimonial) => (
            <div key={testimonial.id} className="rounded-lg border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] p-6">
              <div className="flex gap-0.5 text-[color:var(--color-feedback-warning)]" aria-label={`${testimonial.rating} out of 5 stars`}>
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="h-4 w-4 fill-current" aria-hidden="true" />
                ))}
              </div>
              <p className="mt-3 text-body text-[color:var(--color-text-body)]">&ldquo;{testimonial.reviewText}&rdquo;</p>
              <p className="mt-4 text-small font-semibold text-[color:var(--color-text-primary)]">{testimonial.clientName}</p>
              {testimonial.company && <p className="text-small text-[color:var(--color-text-muted)]">{testimonial.company}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function FaqSection({ faqs }: { faqs: Faqs }): React.ReactElement | null {
  if (faqs.length === 0) return null;
  return (
    <section className="py-24">
      <div className="mx-auto max-w-[760px] px-5 lg:px-8">
        <h2 className="font-display text-h2 font-bold text-[color:var(--color-text-primary)]">Frequently asked questions</h2>
        <div className="mt-8 flex flex-col divide-y divide-[color:var(--color-border-default)]">
          {faqs.map((faq) => (
            <details key={faq.id} className="group py-4">
              <summary className="flex cursor-pointer items-center justify-between text-body font-semibold text-[color:var(--color-text-primary)]">
                {faq.question}
              </summary>
              <div
                className="mt-2 text-body text-[color:var(--color-text-muted)]"
                dangerouslySetInnerHTML={{ __html: faq.answer }}
              />
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}

export function CtaBand({ className }: { className?: string }): React.ReactElement {
  return (
    <section
      className={cn('py-20 text-center', className)}
      style={{ background: 'linear-gradient(135deg, var(--color-brand-primary), #6366F1)' }}
    >
      <div className="mx-auto max-w-content-xl px-5 lg:px-8">
        <h2 className="font-display text-h2 font-bold text-white">Ready to start your project?</h2>
        <p className="mt-3 text-body-lg text-white/90">Tell us what you need — we&apos;ll reply within 24 hours.</p>
        <Link
          href="/contact"
          className="mt-6 inline-flex h-[52px] items-center justify-center rounded-md bg-white px-6 text-body-lg font-medium text-[color:var(--color-brand-primary)] hover:bg-white/90"
        >
          Get in touch
        </Link>
      </div>
    </section>
  );
}
