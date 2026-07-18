import type { Metadata } from 'next';
import { requirePermissionOrRedirect } from '@/lib/auth/guards';
import { PageHeader } from '@/components/admin/page-primitives';
import { TeamMemberEditorForm } from '@/components/admin/team-member-editor-form';

export const metadata: Metadata = {
  title: 'Add team member',
  robots: { index: false, follow: false },
};

export default async function NewTeamMemberPage(): Promise<React.ReactElement> {
  await requirePermissionOrRedirect('TEAM', 'CREATE', '/admin/team/new');
  return (
    <>
      <PageHeader title="Add team member" />
      <TeamMemberEditorForm />
    </>
  );
}
