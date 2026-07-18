'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Trash2 } from 'lucide-react';
import { upsertLead, deleteLead } from '@/lib/actions/crm-actions';
import { upsertLeadSchema, type UpsertLeadInput } from '@/lib/validation/crm';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Alert } from '@/components/ui/alert';
import type { Lead } from '@prisma/client';

/** Lead create/edit dialog (Stage 4 §9). */
export function LeadEditorDialog({
  lead,
  onClose,
  onSaved,
  onDeleted,
}: {
  lead: Lead | null;
  onClose: () => void;
  onSaved: (lead: Lead) => void;
  onDeleted: (id: string) => void;
}): React.ReactElement {
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit } = useForm<UpsertLeadInput>({
    resolver: zodResolver(upsertLeadSchema),
    defaultValues: lead
      ? {
          ...lead,
          company: lead.company ?? undefined,
          phone: lead.phone ?? undefined,
          country: lead.country ?? undefined,
          industry: lead.industry ?? undefined,
          budget: lead.budget ?? undefined,
          timeline: lead.timeline ?? undefined,
          source: lead.source ?? undefined,
          followUpDate: lead.followUpDate ?? undefined,
          lostReason: lead.lostReason ?? undefined,
          assignedUserId: lead.assignedUserId ?? undefined,
        }
      : { name: '', email: '', status: 'NEW', priority: 'MEDIUM', proposalSent: false },
  });

  async function onSubmit(values: UpsertLeadInput): Promise<void> {
    setSubmitting(true);
    const result = await upsertLead(lead ? { ...values, id: lead.id } : values);
    setSubmitting(false);
    if (!result.ok) {
      setFormError(result.error.message);
      return;
    }
    onSaved(result.data);
  }

  async function handleDelete(): Promise<void> {
    if (!lead) return;
    const result = await deleteLead(lead.id);
    if (result.ok) onDeleted(lead.id);
  }

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} aria-hidden="true" />
      <div
        role="dialog"
        aria-modal="true"
        className="relative max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-lg border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] p-6"
      >
        <h2 className="font-display text-h4 font-bold text-[color:var(--color-text-primary)]">
          {lead ? 'Edit lead' : 'Add lead'}
        </h2>
        {formError && (
          <Alert tone="error" className="mt-3">
            {formError}
          </Alert>
        )}
        <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="mt-4 flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Name" required {...register('name')} />
            <FormField label="Email" type="email" required {...register('email')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Company" {...register('company')} />
            <FormField label="Phone" {...register('phone')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Country" {...register('country')} />
            <FormField label="Industry" {...register('industry')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <FormField label="Budget" {...register('budget')} />
            <FormField label="Timeline" {...register('timeline')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1.5">
              <label className="text-small font-semibold">Priority</label>
              <select
                {...register('priority')}
                className="h-11 rounded-md border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] px-3"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-small font-semibold">Status</label>
              <select
                {...register('status')}
                className="h-11 rounded-md border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] px-3"
              >
                <option value="NEW">New</option>
                <option value="CONTACTED">Contacted</option>
                <option value="PROPOSAL_SENT">Proposal Sent</option>
                <option value="WON">Won</option>
                <option value="LOST">Lost</option>
              </select>
            </div>
          </div>
          <label className="flex items-center gap-2 text-small">
            <input type="checkbox" {...register('proposalSent')} className="h-4 w-4" />
            Proposal sent
          </label>
          <div className="flex justify-between border-t border-[color:var(--color-border-default)] pt-4">
            {lead ? (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                onClick={() => void handleDelete()}
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
                Delete
              </Button>
            ) : (
              <span />
            )}
            <div className="flex gap-2">
              <Button type="button" variant="secondary" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" loading={submitting}>
                Save
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
