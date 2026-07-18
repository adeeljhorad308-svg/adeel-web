'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Star } from 'lucide-react';
import { DataTable } from '@/components/admin/data-table';
import { StatusPill } from '@/components/admin/status-pill';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { FilterToolbar } from '@/components/admin/filter-toolbar';
import { EmptyState } from '@/components/admin/page-primitives';
import { Button } from '@/components/ui/button';
import { deleteProject } from '@/lib/actions/portfolio-actions';
import type { Project } from '@prisma/client';

/** Portfolio Manager list (Stage 4 §3). */
export function PortfolioListClient({
  initialProjects,
}: {
  initialProjects: Project[];
}): React.ReactElement {
  const router = useRouter();
  const [projects, setProjects] = useState(initialProjects);
  const [pendingDelete, setPendingDelete] = useState<Project | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete(): void {
    if (!pendingDelete) return;
    startTransition(async () => {
      const result = await deleteProject(pendingDelete.id);
      if (result.ok) setProjects((prev) => prev.filter((p) => p.id !== pendingDelete.id));
      setPendingDelete(null);
      router.refresh();
    });
  }

  return (
    <>
      <FilterToolbar
        searchPlaceholder="Search projects…"
        selects={[
          {
            param: 'status',
            label: 'Status',
            options: [
              { value: 'DRAFT', label: 'Draft' },
              { value: 'PUBLISHED', label: 'Published' },
              { value: 'ARCHIVED', label: 'Archived' },
            ],
          },
          {
            param: 'featured',
            label: 'Featured',
            options: [
              { value: 'true', label: 'Featured' },
              { value: 'false', label: 'Not featured' },
            ],
          },
        ]}
      />
      {projects.length === 0 ? (
        <EmptyState
          title="No projects yet"
          description="Add your first project to build your portfolio."
          action={
            <Link href="/admin/portfolio/new">
              <Button>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add project
              </Button>
            </Link>
          }
        />
      ) : (
        <DataTable<Project>
          caption="Portfolio projects"
          rows={projects}
          getRowId={(row) => row.id}
          columns={[
            {
              key: 'title',
              header: 'Title',
              render: (row) => (
                <span className="flex items-center gap-1.5 font-medium">
                  {row.featured && (
                    <Star
                      className="h-3.5 w-3.5 fill-current text-[color:var(--color-feedback-warning)]"
                      aria-hidden="true"
                    />
                  )}
                  {row.title}
                </span>
              ),
            },
            {
              key: 'client',
              header: 'Client',
              render: (row) => row.clientName ?? '—',
              hideOnMobile: true,
            },
            {
              key: 'status',
              header: 'Status',
              render: (row) => <StatusPill status={row.status} />,
            },
            { key: 'order', header: 'Order', render: (row) => row.order },
          ]}
          rowActions={(row) => (
            <div className="flex justify-end gap-1">
              <Link
                href={`/admin/portfolio/${row.id}`}
                className="rounded-md p-2 text-[color:var(--color-text-body)] hover:bg-[color:var(--color-bg-subtle)]"
                aria-label={`Edit ${row.title}`}
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </Link>
              <button
                onClick={() => setPendingDelete(row)}
                className="rounded-md p-2 text-[color:var(--color-feedback-error)] hover:bg-[color:var(--color-bg-subtle)]"
                aria-label={`Delete ${row.title}`}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}
        />
      )}
      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Delete "${pendingDelete?.title}"?`}
        description="This archives the project and removes it from the public site."
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
        loading={isPending}
      />
    </>
  );
}
