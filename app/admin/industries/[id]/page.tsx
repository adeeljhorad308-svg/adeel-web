import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requirePermissionOrRedirect } from '@/lib/auth/guards';
import { getIndustry } from '@/lib/actions/industries-actions';
import { PageHeader } from '@/components/admin/page-primitives';
import { IndustryEditorForm } from '@/components/admin/industry-editor-form';

export const metadata: Metadata = {
  title: 'Edit industry',
  robots: { index: false, follow: false },
};

export default async function EditIndustryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  await requirePermissionOrRedirect('INDUSTRIES', 'EDIT', '/admin/industries');
  const { id } = await params;
  const result = await getIndustry(id);
  if (!result.ok || !result.data) notFound();

  return (
    <>
      <PageHeader title={`Edit "${result.data.name}"`} />
      <IndustryEditorForm industry={result.data} />
    </>
  );
}
