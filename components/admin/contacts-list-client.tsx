'use client';

import { useState, useTransition } from 'react';
import { Trash2, ArrowRightCircle, Download } from 'lucide-react';
import { DataTable } from '@/components/admin/data-table';
import { StatusPill } from '@/components/admin/status-pill';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { FilterToolbar } from '@/components/admin/filter-toolbar';
import { EmptyState } from '@/components/admin/page-primitives';
import { Button } from '@/components/ui/button';
import {
  updateContactRequest,
  deleteContactRequest,
  exportContactRequestsCsv,
} from '@/lib/actions/contact-actions';
import { convertContactToLead } from '@/lib/actions/crm-actions';
import { ClientFormattedDate } from '@/components/ui/client-formatted-date';
import type { ContactRequest } from '@prisma/client';

/** Contact Requests list (Stage 4 §8): filter, reply-status, assign, export, convert-to-lead, delete. */
export function ContactsListClient({ initial }: { initial: ContactRequest[] }): React.ReactElement {
  const [rows, setRows] = useState(initial);
  const [pendingDelete, setPendingDelete] = useState<ContactRequest | null>(null);
  const [isPending, startTransition] = useTransition();

  function setStatus(row: ContactRequest, replyStatus: ContactRequest['replyStatus']): void {
    setRows((prev) => prev.map((r) => (r.id === row.id ? { ...r, replyStatus } : r)));
    startTransition(async () => {
      await updateContactRequest({ id: row.id, replyStatus });
    });
  }

  function convert(row: ContactRequest): void {
    startTransition(async () => {
      await convertContactToLead(row.id);
      setStatus(row, 'REPLIED');
    });
  }

  function handleDelete(): void {
    if (!pendingDelete) return;
    startTransition(async () => {
      const result = await deleteContactRequest(pendingDelete.id);
      if (result.ok) setRows((prev) => prev.filter((r) => r.id !== pendingDelete.id));
      setPendingDelete(null);
    });
  }

  async function exportCsv(): Promise<void> {
    const result = await exportContactRequestsCsv({ page: 1, pageSize: 1000, order: 'desc' });
    if (!result.ok) return;
    const blob = new Blob([result.data], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'contact-requests.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  if (rows.length === 0) {
    return (
      <EmptyState
        title="No contact requests yet"
        description="Submissions from your public contact form will appear here."
      />
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <FilterToolbar
          searchPlaceholder="Search contacts…"
          selects={[
            {
              param: 'replyStatus',
              label: 'Status',
              options: [
                { value: 'NEW', label: 'New' },
                { value: 'REPLIED', label: 'Replied' },
                { value: 'CLOSED', label: 'Closed' },
              ],
            },
          ]}
        />
        <Button variant="secondary" onClick={() => void exportCsv()}>
          <Download className="h-4 w-4" aria-hidden="true" />
          Export CSV
        </Button>
      </div>
      <DataTable<ContactRequest>
        caption="Contact requests"
        rows={rows}
        getRowId={(r) => r.id}
        columns={[
          {
            key: 'name',
            header: 'Name',
            render: (r) => <span className="font-medium">{r.name}</span>,
          },
          { key: 'email', header: 'Email', render: (r) => r.email, hideOnMobile: true },
          {
            key: 'service',
            header: 'Service',
            render: (r) => r.serviceInterest ?? '—',
            hideOnMobile: true,
          },
          {
            key: 'status',
            header: 'Status',
            render: (r) => (
              <StatusPill
                status={
                  r.replyStatus === 'NEW'
                    ? 'DRAFT'
                    : r.replyStatus === 'REPLIED'
                      ? 'PUBLISHED'
                      : 'ARCHIVED'
                }
              />
            ),
          },
          {
            key: 'date',
            header: 'Received',
            render: (r) => <ClientFormattedDate date={r.createdAt} format="date" />,
            hideOnMobile: true,
          },
        ]}
        rowActions={(row) => (
          <div className="flex justify-end gap-1">
            <select
              value={row.replyStatus}
              onChange={(e) => setStatus(row, e.target.value as ContactRequest['replyStatus'])}
              className="h-8 rounded-md border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] px-2 text-small"
            >
              <option value="NEW">New</option>
              <option value="REPLIED">Replied</option>
              <option value="CLOSED">Closed</option>
            </select>
            <button
              onClick={() => convert(row)}
              aria-label={`Convert ${row.name} to lead`}
              className="rounded-md p-2 text-[color:var(--color-brand-primary)] hover:bg-[color:var(--color-bg-subtle)]"
            >
              <ArrowRightCircle className="h-4 w-4" aria-hidden="true" />
            </button>
            <button
              onClick={() => setPendingDelete(row)}
              aria-label={`Delete request from ${row.name}`}
              className="rounded-md p-2 text-[color:var(--color-feedback-error)] hover:bg-[color:var(--color-bg-subtle)]"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        )}
      />
      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this request?"
        description="This cannot be undone."
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
        loading={isPending}
      />
    </>
  );
}
