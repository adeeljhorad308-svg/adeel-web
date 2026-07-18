'use client';

import { useState, useTransition } from 'react';
import { LayoutGrid, List, Plus } from 'lucide-react';
import { moveLeadStage } from '@/lib/actions/crm-actions';
import { EmptyState } from '@/components/admin/page-primitives';
import { Button } from '@/components/ui/button';
import { LeadEditorDialog } from '@/components/admin/lead-editor-dialog';
import type { Lead, LeadStatus } from '@prisma/client';

const STAGES: { key: LeadStatus; label: string }[] = [
  { key: 'NEW', label: 'New' },
  { key: 'CONTACTED', label: 'Contacted' },
  { key: 'PROPOSAL_SENT', label: 'Proposal Sent' },
  { key: 'WON', label: 'Won' },
  { key: 'LOST', label: 'Lost' },
];

/**
 * CRM Leads (Stage 4 §9). Offers Kanban (drag replaced by a stage <select> for
 * full keyboard operability) and table views over the same data.
 */
export function CrmBoardClient({ initial }: { initial: Lead[] }): React.ReactElement {
  const [leads, setLeads] = useState(initial);
  const [view, setView] = useState<'board' | 'table'>('board');
  const [editing, setEditing] = useState<Lead | null | undefined>(undefined); // undefined = closed, null = new
  const [, startTransition] = useTransition();

  function changeStage(lead: Lead, status: LeadStatus): void {
    setLeads((prev) => prev.map((l) => (l.id === lead.id ? { ...l, status } : l)));
    startTransition(async () => {
      await moveLeadStage({ id: lead.id, status });
    });
  }

  function onSaved(lead: Lead): void {
    setLeads((prev) => {
      const exists = prev.some((l) => l.id === lead.id);
      return exists ? prev.map((l) => (l.id === lead.id ? lead : l)) : [lead, ...prev];
    });
    setEditing(undefined);
  }

  function onDeleted(id: string): void {
    setLeads((prev) => prev.filter((l) => l.id !== id));
    setEditing(undefined);
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <div className="flex gap-1 rounded-md border border-[color:var(--color-border-default)] p-1">
          <button
            onClick={() => setView('board')}
            className={`rounded p-1.5 ${view === 'board' ? 'bg-[color:var(--color-brand-tint)] text-[color:var(--color-brand-primary)]' : 'text-[color:var(--color-text-muted)]'}`}
            aria-label="Board view"
          >
            <LayoutGrid className="h-4 w-4" aria-hidden="true" />
          </button>
          <button
            onClick={() => setView('table')}
            className={`rounded p-1.5 ${view === 'table' ? 'bg-[color:var(--color-brand-tint)] text-[color:var(--color-brand-primary)]' : 'text-[color:var(--color-text-muted)]'}`}
            aria-label="Table view"
          >
            <List className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <Button onClick={() => setEditing(null)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add lead
        </Button>
      </div>

      {leads.length === 0 ? (
        <EmptyState
          title="No leads yet"
          description="Leads from converted contacts or manual entry will appear here."
        />
      ) : view === 'board' ? (
        <div className="grid grid-cols-1 gap-4 overflow-x-auto sm:grid-cols-2 lg:grid-cols-5">
          {STAGES.map((stage) => (
            <div
              key={stage.key}
              className="flex flex-col gap-2 rounded-lg bg-[color:var(--color-bg-subtle)] p-3"
            >
              <p className="text-overline font-semibold uppercase text-[color:var(--color-text-muted)]">
                {stage.label} ({leads.filter((l) => l.status === stage.key).length})
              </p>
              {leads
                .filter((l) => l.status === stage.key)
                .map((lead) => (
                  <button
                    key={lead.id}
                    onClick={() => setEditing(lead)}
                    className="rounded-md border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] p-3 text-left"
                  >
                    <p className="text-small font-semibold text-[color:var(--color-text-primary)]">
                      {lead.name}
                    </p>
                    {lead.company && (
                      <p className="text-small text-[color:var(--color-text-muted)]">
                        {lead.company}
                      </p>
                    )}
                    <select
                      value={lead.status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => changeStage(lead, e.target.value as LeadStatus)}
                      className="mt-2 h-7 w-full rounded border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-page)] text-overline"
                    >
                      {STAGES.map((s) => (
                        <option key={s.key} value={s.key}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                  </button>
                ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-[color:var(--color-border-default)]">
          <table className="w-full text-left text-small">
            <thead>
              <tr className="border-b border-[color:var(--color-border-default)]">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Priority</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr
                  key={lead.id}
                  className="cursor-pointer border-b border-[color:var(--color-border-default)] last:border-0"
                  onClick={() => setEditing(lead)}
                >
                  <td className="px-4 py-3 font-medium">{lead.name}</td>
                  <td className="px-4 py-3">{lead.company ?? '—'}</td>
                  <td className="px-4 py-3">{lead.status}</td>
                  <td className="px-4 py-3">{lead.priority}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing !== undefined && (
        <LeadEditorDialog
          lead={editing}
          onClose={() => setEditing(undefined)}
          onSaved={onSaved}
          onDeleted={onDeleted}
        />
      )}
    </>
  );
}
