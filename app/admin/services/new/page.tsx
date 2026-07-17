import type { Metadata } from 'next';
import { requirePermissionOrRedirect } from '@/lib/auth/guards';
import { PageHeader } from '@/components/admin/page-primitives';
import { ServiceEditorForm } from '@/components/admin/service-editor-form';

export const metadata: Metadata = { title: 'Add service', robots: { index: false, follow: false } };

export default async function NewServicePage(): Promise<React.ReactElement> {
  await requirePermissionOrRedirect('SERVICES', 'CREATE', '/admin/services/new');
  return (
    <>
      <PageHeader title="Add service" />
      <ServiceEditorForm />
    </>
  );
}
