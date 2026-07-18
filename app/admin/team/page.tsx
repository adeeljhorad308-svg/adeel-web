import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { requirePermissionOrRedirect } from '@/lib/auth/guards';
import { listTeamMembers } from '@/lib/actions/team-actions';
import { PageHeader } from '@/components/admin/page-primitives';
import { Button } from '@/components/ui/button';
import { TeamListClient } from '@/components/admin/team-list-client';

export const metadata: Metadata = { title: 'Team', robots: { index: false, follow: false } };

export default async function AdminTeamPage(): Promise<React.ReactElement> {
  await requirePermissionOrRedirect('TEAM', 'VIEW', '/admin/team');
  const result = await listTeamMembers({ page: 1, pageSize: 50, order: 'asc' });
  const members = result.ok ? result.data.items : [];

  return (
    <>
      <PageHeader
        title="Team"
        description="Manage the people shown on your About page."
        action={
          <Link href="/admin/team/new">
            <Button>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add member
            </Button>
          </Link>
        }
      />
      <TeamListClient initialMembers={[...members]} />
    </>
  );
}
