import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requirePermissionOrRedirect } from '@/lib/auth/guards';
import { getTeamMember } from '@/lib/actions/team-actions';
import { PageHeader } from '@/components/admin/page-primitives';
import { TeamMemberEditorForm } from '@/components/admin/team-member-editor-form';

export const metadata: Metadata = { title: 'Edit team member', robots: { index: false, follow: false } };

export default async function EditTeamMemberPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  await requirePermissionOrRedirect('TEAM', 'EDIT', '/admin/team');
  const { id } = await params;

  const result = await getTeamMember(id);
  if (!result.ok || !result.data) notFound();

  return (
    <>
      <PageHeader title={`Edit "${result.data.name}"`} />
      <TeamMemberEditorForm member={result.data} />
    </>
  );
}
