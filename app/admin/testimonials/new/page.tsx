import type { Metadata } from 'next';
import { requirePermissionOrRedirect } from '@/lib/auth/guards';
import { PageHeader } from '@/components/admin/page-primitives';
import { TestimonialEditorForm } from '@/components/admin/testimonial-editor-form';

export const metadata: Metadata = { title: 'Add testimonial', robots: { index: false, follow: false } };

export default async function NewTestimonialPage(): Promise<React.ReactElement> {
  await requirePermissionOrRedirect('TESTIMONIALS', 'CREATE', '/admin/testimonials/new');
  return (
    <>
      <PageHeader title="Add testimonial" />
      <TestimonialEditorForm />
    </>
  );
}
