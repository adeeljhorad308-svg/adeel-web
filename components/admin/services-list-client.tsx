'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2 } from 'lucide-react';
import { DataTable } from '@/components/admin/data-table';
import { StatusPill } from '@/components/admin/status-pill';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { EmptyState } from '@/components/admin/page-primitives';
import { Button } from '@/components/ui/button';
import { deleteService } from '@/lib/actions/services-actions';
import type { Service } from '@prisma/client';

/**
 * Services list (Stage 4 §4). Renders through the shared DataTable pattern with
 * per-row edit/delete actions. Delete goes through ConfirmDialog rather than a
 * native confirm(), and calls the real `deleteService` Server Action.
 */
export function ServicesListClient({ initialServices }: { initialServices: Service[] }): React.ReactElement {
  const router = useRouter();
  const [services, setServices] = useState(initialServices);
  const [pendingDelete, setPendingDelete] = useState<Service | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete(): void {
    if (!pendingDelete) return;
    startTransition(async () => {
      const result = await deleteService(pendingDelete.id);
      if (result.ok) {
        setServices((prev) => prev.filter((s) => s.id !== pendingDelete.id));
      }
      setPendingDelete(null);
      router.refresh();
    });
  }

  if (services.length === 0) {
    return (
      <EmptyState
        title="No services yet"
        description="Add your first service to show it on the public site and in quotes."
        action={
          <Link href="/admin/services/new">
            <Button>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add service
            </Button>
          </Link>
        }
      />
    );
  }

  return (
    <>
      <DataTable<Service>
        caption="Services"
        rows={services}
        getRowId={(row) => row.id}
        columns={[
          { key: 'name', header: 'Name', render: (row) => <span className="font-medium">{row.name}</span> },
          { key: 'benefit', header: 'Benefit', render: (row) => row.shortBenefit, hideOnMobile: true },
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
              href={`/admin/services/${row.id}`}
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
      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Delete "${pendingDelete?.name}"?`}
        description="This removes the service from the public site. This action cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
        loading={isPending}
      />
    </>
  );
}
