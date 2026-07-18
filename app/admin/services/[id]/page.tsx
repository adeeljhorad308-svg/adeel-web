import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requirePermissionOrRedirect } from '@/lib/auth/guards';
import { getService } from '@/lib/actions/services-actions';
import { PageHeader } from '@/components/admin/page-primitives';
import { ServiceEditorForm } from '@/components/admin/service-editor-form';

export const metadata: Metadata = {
  title: 'Edit service',
  robots: { index: false, follow: false },
};

export default async function EditServicePage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  await requirePermissionOrRedirect('SERVICES', 'EDIT', '/admin/services');
  const { id } = await params;

  const result = await getService(id);
  if (!result.ok || !result.data) notFound();

  return (
    <>
      <PageHeader title={`Edit "${result.data.name}"`} />
      <ServiceEditorForm service={result.data} />
    </>
  );
}
