import type { Metadata } from 'next';
import { requirePermissionOrRedirect } from '@/lib/auth/guards';
import { PageHeader } from '@/components/admin/page-primitives';
import { ProjectEditorForm } from '@/components/admin/project-editor-form';

export const metadata: Metadata = { title: 'Add project', robots: { index: false, follow: false } };

export default async function NewProjectPage(): Promise<React.ReactElement> {
  await requirePermissionOrRedirect('PORTFOLIO', 'CREATE', '/admin/portfolio/new');
  return (
    <>
      <PageHeader title="Add project" />
      <ProjectEditorForm />
    </>
  );
}
