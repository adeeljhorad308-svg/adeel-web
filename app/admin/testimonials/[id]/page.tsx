import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requirePermissionOrRedirect } from '@/lib/auth/guards';
import { getTestimonial } from '@/lib/actions/testimonials-actions';
import { PageHeader } from '@/components/admin/page-primitives';
import { TestimonialEditorForm } from '@/components/admin/testimonial-editor-form';

export const metadata: Metadata = { title: 'Edit testimonial', robots: { index: false, follow: false } };

export default async function EditTestimonialPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  await requirePermissionOrRedirect('TESTIMONIALS', 'EDIT', '/admin/testimonials');
  const { id } = await params;
  const result = await getTestimonial(id);
  if (!result.ok || !result.data) notFound();

  return (
    <>
      <PageHeader title={`Edit testimonial from "${result.data.clientName}"`} />
      <TestimonialEditorForm testimonial={result.data} />
    </>
  );
}
