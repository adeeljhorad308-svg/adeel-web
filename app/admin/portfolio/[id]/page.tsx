import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requirePermissionOrRedirect } from '@/lib/auth/guards';
import { getProject } from '@/lib/actions/portfolio-actions';
import { PageHeader } from '@/components/admin/page-primitives';
import { ProjectEditorForm } from '@/components/admin/project-editor-form';

export const metadata: Metadata = { title: 'Edit project', robots: { index: false, follow: false } };

export default async function EditProjectPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  await requirePermissionOrRedirect('PORTFOLIO', 'EDIT', '/admin/portfolio');
  const { id } = await params;
  const result = await getProject(id);
  if (!result.ok || !result.data) notFound();

  return (
    <>
      <PageHeader title={`Edit "${result.data.title}"`} />
      <ProjectEditorForm project={result.data} />
    </>
  );
}
