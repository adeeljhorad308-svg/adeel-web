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
import { deleteTestimonial } from '@/lib/actions/testimonials-actions';
import type { Testimonial } from '@prisma/client';

/** Testimonials list (Stage 4 §6). Publication gate: only PUBLISHED shows
 *  publicly; unpublished/no testimonials means the public section hides entirely
 *  (Stage 2/3 contract) — never fabricated reviews. */
export function TestimonialsListClient({
  initialTestimonials,
}: {
  initialTestimonials: Testimonial[];
}): React.ReactElement {
  const router = useRouter();
  const [testimonials, setTestimonials] = useState(initialTestimonials);
  const [pendingDelete, setPendingDelete] = useState<Testimonial | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete(): void {
    if (!pendingDelete) return;
    startTransition(async () => {
      const result = await deleteTestimonial(pendingDelete.id);
      if (result.ok) setTestimonials((prev) => prev.filter((t) => t.id !== pendingDelete.id));
      setPendingDelete(null);
      router.refresh();
    });
  }

  return (
    <>
      <FilterToolbar
        searchPlaceholder="Search testimonials…"
        selects={[
          {
            param: 'status',
            label: 'Status',
            options: [
              { value: 'DRAFT', label: 'Draft' },
              { value: 'PUBLISHED', label: 'Published' },
            ],
          },
        ]}
      />
      {testimonials.length === 0 ? (
        <EmptyState
          title="No testimonials yet"
          description="Add a real client review to build trust on your site."
          action={
            <Link href="/admin/testimonials/new">
              <Button><Plus className="h-4 w-4" aria-hidden="true" />Add testimonial</Button>
            </Link>
          }
        />
      ) : (
        <DataTable<Testimonial>
          caption="Testimonials"
          rows={testimonials}
          getRowId={(row) => row.id}
          columns={[
            { key: 'client', header: 'Client', render: (row) => <span className="font-medium">{row.clientName}</span> },
            { key: 'company', header: 'Company', render: (row) => row.company ?? '—', hideOnMobile: true },
            {
              key: 'rating',
              header: 'Rating',
              render: (row) => (
                <span className="flex items-center gap-1">
                  <Star className="h-3.5 w-3.5 fill-current text-[color:var(--color-feedback-warning)]" aria-hidden="true" />
                  {row.rating}/5
                </span>
              ),
            },
            { key: 'status', header: 'Status', render: (row) => <StatusPill status={row.status} /> },
          ]}
          rowActions={(row) => (
            <div className="flex justify-end gap-1">
              <Link
                href={`/admin/testimonials/${row.id}`}
                className="rounded-md p-2 text-[color:var(--color-text-body)] hover:bg-[color:var(--color-bg-subtle)]"
                aria-label={`Edit testimonial from ${row.clientName}`}
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </Link>
              <button
                onClick={() => setPendingDelete(row)}
                className="rounded-md p-2 text-[color:var(--color-feedback-error)] hover:bg-[color:var(--color-bg-subtle)]"
                aria-label={`Delete testimonial from ${row.clientName}`}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          )}
        />
      )}
      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Delete testimonial from "${pendingDelete?.clientName}"?`}
        description="This removes it from the public site permanently."
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
        loading={isPending}
      />
    </>
  );
}
