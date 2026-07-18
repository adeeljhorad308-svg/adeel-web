import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { requirePermissionOrRedirect } from '@/lib/auth/guards';
import { listTestimonials } from '@/lib/actions/testimonials-actions';
import { PageHeader } from '@/components/admin/page-primitives';
import { Button } from '@/components/ui/button';
import { TestimonialsListClient } from '@/components/admin/testimonials-list-client';

export const metadata: Metadata = {
  title: 'Testimonials',
  robots: { index: false, follow: false },
};

export default async function AdminTestimonialsPage(): Promise<React.ReactElement> {
  await requirePermissionOrRedirect('TESTIMONIALS', 'VIEW', '/admin/testimonials');
  const result = await listTestimonials({ page: 1, pageSize: 50, order: 'asc' });
  const testimonials = result.ok ? result.data.items : [];

  return (
    <>
      <PageHeader
        title="Testimonials"
        description="Manage real client reviews shown on your site."
        action={
          <Link href="/admin/testimonials/new">
            <Button>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add testimonial
            </Button>
          </Link>
        }
      />
      <TestimonialsListClient initialTestimonials={[...testimonials]} />
    </>
  );
}
