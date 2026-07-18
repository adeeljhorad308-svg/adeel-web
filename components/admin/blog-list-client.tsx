'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Pencil, Trash2, Clock } from 'lucide-react';
import { DataTable } from '@/components/admin/data-table';
import { StatusPill } from '@/components/admin/status-pill';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { FilterToolbar } from '@/components/admin/filter-toolbar';
import { EmptyState } from '@/components/admin/page-primitives';
import { Button } from '@/components/ui/button';
import { ClientFormattedDate } from '@/components/ui/client-formatted-date';
import { deletePost } from '@/lib/actions/blog-actions';
import type { Post } from '@prisma/client';

/** Blog CMS list (Stage 4 §7). Scheduled posts show their scheduled date/time
 *  distinctly so staff can see what will auto-publish and when. */
export function BlogListClient({ initialPosts }: { initialPosts: Post[] }): React.ReactElement {
  const router = useRouter();
  const [posts, setPosts] = useState(initialPosts);
  const [pendingDelete, setPendingDelete] = useState<Post | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleDelete(): void {
    if (!pendingDelete) return;
    startTransition(async () => {
      const result = await deletePost(pendingDelete.id);
      if (result.ok) setPosts((prev) => prev.filter((p) => p.id !== pendingDelete.id));
      setPendingDelete(null);
      router.refresh();
    });
  }

  return (
    <>
      <FilterToolbar
        searchPlaceholder="Search articles…"
        selects={[
          {
            param: 'status',
            label: 'Status',
            options: [
              { value: 'DRAFT', label: 'Draft' },
              { value: 'PUBLISHED', label: 'Published' },
              { value: 'SCHEDULED', label: 'Scheduled' },
            ],
          },
        ]}
      />
      {posts.length === 0 ? (
        <EmptyState
          title="No articles yet"
          description="Write your first blog post to start attracting organic traffic."
          action={
            <Link href="/admin/blog/new">
              <Button>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Write article
              </Button>
            </Link>
          }
        />
      ) : (
        <DataTable<Post>
          caption="Blog posts"
          rows={posts}
          getRowId={(row) => row.id}
          columns={[
            {
              key: 'title',
              header: 'Title',
              render: (row) => <span className="font-medium">{row.title}</span>,
            },
            {
              key: 'status',
              header: 'Status',
              render: (row) => (
                <div className="flex items-center gap-2">
                  <StatusPill status={row.status === 'SCHEDULED' ? 'DRAFT' : row.status} />
                  {row.status === 'SCHEDULED' && row.scheduledAt && (
                    <span className="flex items-center gap-1 text-overline text-[color:var(--color-text-muted)]">
                      <Clock className="h-3 w-3" aria-hidden="true" />
                      <ClientFormattedDate date={row.scheduledAt} />
                    </span>
                  )}
                </div>
              ),
            },
            {
              key: 'readingTime',
              header: 'Reading time',
              render: (row) => `${row.readingTime} min`,
              hideOnMobile: true,
            },
          ]}
          rowActions={(row) => (
            <div className="flex justify-end gap-1">
              <Link
                href={`/admin/blog/${row.id}`}
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
        description="This removes the article from the public site."
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
        loading={isPending}
      />
    </>
  );
}
