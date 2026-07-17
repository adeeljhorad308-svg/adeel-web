'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { upsertService } from '@/lib/actions/services-actions';
import { upsertServiceSchema, type UpsertServiceInput } from '@/lib/validation/services';
import { slugify } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Alert } from '@/components/ui/alert';
import { VersionHistoryPanel } from '@/components/admin/version-history-panel';
import type { Service } from '@prisma/client';

/**
 * Service editor (Stage 4 §4). Handles both create (no `service` prop) and edit.
 * On edit, the form carries the `version` the page loaded; if another admin saved
 * in the meantime, the server returns a CONFLICT (409) and this form surfaces it
 * as a specific, actionable message rather than a generic error (Stage 5
 * improvement: optimistic concurrency).
 */
export function ServiceEditorForm({ service }: { service?: Service }): React.ReactElement {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UpsertServiceInput>({
    resolver: zodResolver(upsertServiceSchema),
    defaultValues: service
      ? {
          id: service.id,
          version: service.version,
          name: service.name,
          slug: service.slug,
          iconKey: service.iconKey,
          shortBenefit: service.shortBenefit,
          descriptionRich: service.descriptionRich,
          order: service.order,
          visible: service.visible,
          quickFormEnabled: service.quickFormEnabled,
          features: [],
          benefits: [],
          processSteps: [],
          faqs: [],
          technologyIds: [],
        }
      : {
          name: '',
          slug: '',
          iconKey: '',
          shortBenefit: '',
          descriptionRich: '',
          order: 0,
          visible: true,
          quickFormEnabled: false,
          features: [],
          benefits: [],
          processSteps: [],
          faqs: [],
          technologyIds: [],
        },
  });

  const featureFields = useFieldArray({ control, name: 'features' });
  const nameValue = watch('name');

  async function onSubmit(values: UpsertServiceInput): Promise<void> {
    setSubmitting(true);
    setFormError(null);
    setConflict(false);

    const result = await upsertService(values);
    setSubmitting(false);

    if (!result.ok) {
      if (result.error.code === 'CONFLICT') {
        setConflict(true);
        return;
      }
      setFormError(result.error.message);
      return;
    }
    router.push('/admin/services');
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="flex flex-col gap-6" noValidate>
        {service && <input type="hidden" {...register('id')} />}
        {service && <input type="hidden" {...register('version', { valueAsNumber: true })} />}

      {formError && <Alert tone="error">{formError}</Alert>}
      {conflict && (
        <Alert tone="error">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>This service was changed by someone else since you opened it.</span>
            <Button type="button" variant="secondary" size="sm" onClick={() => window.location.reload()}>
              Reload page
            </Button>
          </div>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Name"
          required
          error={errors.name?.message}
          {...register('name', {
            onBlur: () => {
              if (!service && !watch('slug')) {
                setValue('slug', slugify(nameValue ?? ''));
              }
            },
          })}
        />
        <FormField label="Slug" required hint="Used in the public URL." error={errors.slug?.message} {...register('slug')} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField
          label="Icon"
          required
          hint="A Lucide icon name, e.g. Globe."
          error={errors.iconKey?.message}
          {...register('iconKey')}
        />
        <FormField label="Order" type="number" {...register('order', { valueAsNumber: true })} />
      </div>

      <FormField
        label="Short benefit"
        required
        hint="One line shown on the service card."
        error={errors.shortBenefit?.message}
        {...register('shortBenefit')}
      />

      <div className="flex flex-col gap-1.5">
        <label htmlFor="descriptionRich" className="text-small font-semibold text-[color:var(--color-text-primary)]">
          Description
        </label>
        <textarea
          id="descriptionRich"
          rows={6}
          className="w-full rounded-md border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] p-3 text-body text-[color:var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg-page)]"
          {...register('descriptionRich')}
        />
      </div>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-small font-semibold text-[color:var(--color-text-primary)]">Features</legend>
        {featureFields.fields.map((field, index) => (
          <div key={field.id} className="flex items-center gap-2">
            <input
              className="h-11 flex-1 rounded-md border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] px-3 text-body"
              {...register(`features.${index}.label` as const)}
            />
            <button
              type="button"
              onClick={() => featureFields.remove(index)}
              aria-label="Remove feature"
              className="rounded-md p-2 text-[color:var(--color-feedback-error)] hover:bg-[color:var(--color-bg-subtle)]"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => featureFields.append({ label: '', order: featureFields.fields.length })}
          className="w-fit"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add feature
        </Button>
      </fieldset>

      <label className="flex items-center gap-2 text-small text-[color:var(--color-text-body)]">
        <input type="checkbox" {...register('visible')} className="h-4 w-4 rounded border-[color:var(--color-border-default)]" />
        Visible on the public site
      </label>

      <div className="flex justify-end gap-3 border-t border-[color:var(--color-border-default)] pt-4">
        <Button type="button" variant="secondary" onClick={() => router.push('/admin/services')}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {service ? 'Save changes' : 'Create service'}
        </Button>
      </div>
      </form>

      {service && <VersionHistoryPanel entity="SERVICE" entityId={service.id} />}
    </div>
  );
}
