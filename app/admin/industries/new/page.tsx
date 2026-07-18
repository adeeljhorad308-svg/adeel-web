import type { Metadata } from 'next';
import { requirePermissionOrRedirect } from '@/lib/auth/guards';
import { PageHeader } from '@/components/admin/page-primitives';
import { IndustryEditorForm } from '@/components/admin/industry-editor-form';

export const metadata: Metadata = {
  title: 'Add industry',
  robots: { index: false, follow: false },
};

export default async function NewIndustryPage(): Promise<React.ReactElement> {
  await requirePermissionOrRedirect('INDUSTRIES', 'CREATE', '/admin/industries/new');
  return (
    <>
      <PageHeader title="Add industry" />
      <IndustryEditorForm />
    </>
  );
}
