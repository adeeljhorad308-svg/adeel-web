'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/admin/data-table';
import { StatusPill } from '@/components/admin/status-pill';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { FilterToolbar } from '@/components/admin/filter-toolbar';
import { EmptyState } from '@/components/admin/page-primitives';
import { Button } from '@/components/ui/button';
import { deleteTeamMember } from '@/lib/actions/team-actions';
import type { TeamMember } from '@prisma/client';

/** Team Management list (Stage 4 §5). */
export function TeamListClient({
  initialMembers,
}: {
  initialMembers: TeamMember[];
}): React.ReactElement {
  const router = useRouter();
  const [members, setMembers] = useState(initialMembers);
  const [pendingDelete, setPendingDelete] = useState<TeamMember | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete(): void {
    if (!pendingDelete) return;
    startTransition(async () => {
      const result = await deleteTeamMember(pendingDelete.id);
      if (result.ok) setMembers((prev) => prev.filter((m) => m.id !== pendingDelete.id));
      setPendingDelete(null);
      router.refresh();
    });
  }

  return (
    <>
      <FilterToolbar
        searchPlaceholder="Search team…"
        selects={[
          {
            param: 'active',
            label: 'Status',
            options: [
              { value: 'true', label: 'Active' },
              { value: 'false', label: 'Inactive' },
            ],
          },
        ]}
      />
      {members.length === 0 ? (
        <EmptyState
          title="No team members yet"
          description="Add your first team member to show them on the About page."
          action={
            <Link href="/admin/team/new">
              <Button>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add member
              </Button>
            </Link>
          }
        />
      ) : (
        <DataTable<TeamMember>
          caption="Team members"
          rows={members}
          getRowId={(row) => row.id}
          columns={[
            {
              key: 'name',
              header: 'Name',
              render: (row) => <span className="font-medium">{row.name}</span>,
            },
            {
              key: 'designation',
              header: 'Designation',
              render: (row) => row.designation,
              hideOnMobile: true,
            },
            {
              key: 'status',
              header: 'Status',
              render: (row) => <StatusPill status={row.active ? 'ACTIVE' : 'INACTIVE'} />,
            },
          ]}
          rowActions={(row) => (
            <div className="flex justify-end gap-1">
              <Link
                href={`/admin/team/${row.id}`}
                className="rounded-md p-2 text-[color:var(--color-text-body)] hover:bg-[color:var(--color-bg-subtle)]"
                aria-label={`Edit ${row.name}`}
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </Link>
              <button
                onClick={() => setPendingDelete(row)}
                className="rounded-md p-2 text-[color:var(--color-feedback-error)] hover:bg-[color:var(--color-bg-subtle)]"
                aria-label={`Delete ${row.name}`}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}
        />
      )}
      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Remove "${pendingDelete?.name}"?`}
        description="This removes them from the public Team page."
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
        loading={isPending}
      />
    </>
  );
}
