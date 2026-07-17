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
import { deleteIndustry } from '@/lib/actions/industries-actions';
import type { Industry } from '@prisma/client';

/** Industries list (Stage 4 §4 pattern, Stage 3 Page 3). */
export function IndustriesListClient({ initialIndustries }: { initialIndustries: Industry[] }): React.ReactElement {
  const router = useRouter();
  const [industries, setIndustries] = useState(initialIndustries);
  const [pendingDelete, setPendingDelete] = useState<Industry | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete(): void {
    if (!pendingDelete) return;
    startTransition(async () => {
      const result = await deleteIndustry(pendingDelete.id);
      if (result.ok) setIndustries((prev) => prev.filter((i) => i.id !== pendingDelete.id));
      setPendingDelete(null);
      router.refresh();
    });
  }

  return (
    <>
      <FilterToolbar
        searchPlaceholder="Search industries…"
        selects={[
          {
            param: 'visible',
            label: 'Visibility',
            options: [
              { value: 'true', label: 'Visible' },
              { value: 'false', label: 'Hidden' },
            ],
          },
        ]}
      />
      {industries.length === 0 ? (
        <EmptyState
          title="No industries yet"
          description="Add an industry to show tailored solutions for that sector."
          action={
            <Link href="/admin/industries/new">
              <Button>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add industry
              </Button>
            </Link>
          }
        />
      ) : (
        <DataTable<Industry>
          caption="Industries"
          rows={industries}
          getRowId={(row) => row.id}
          columns={[
            { key: 'name', header: 'Name', render: (row) => <span className="font-medium">{row.name}</span> },
            { key: 'tagline', header: 'Tagline', render: (row) => row.tagline ?? '—', hideOnMobile: true },
            {
              key: 'status',
              header: 'Visibility',
              render: (row) => <StatusPill status={row.visible ? 'ACTIVE' : 'INACTIVE'} />,
            },
            { key: 'order', header: 'Order', render: (row) => row.order },
          ]}
          rowActions={(row) => (
            <div className="flex justify-end gap-1">
              <Link
                href={`/admin/industries/${row.id}`}
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
        title={`Delete "${pendingDelete?.name}"?`}
        description="This removes the industry page from the public site."
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
        loading={isPending}
      />
    </>
  );
}
