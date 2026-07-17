'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { upsertIndustry } from '@/lib/actions/industries-actions';
import { upsertIndustrySchema, type UpsertIndustryInput } from '@/lib/validation/industries';
import { slugify } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Alert } from '@/components/ui/alert';
import { VersionHistoryPanel } from '@/components/admin/version-history-panel';
import type { Industry } from '@prisma/client';

/** Industry editor (Stage 4 §4 pattern, Stage 3 Page 4). Same conflict-aware
 *  optimistic-locking behavior as the Service editor. */
export function IndustryEditorForm({ industry }: { industry?: Industry }): React.ReactElement {
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
  } = useForm<UpsertIndustryInput>({
    resolver: zodResolver(upsertIndustrySchema),
    defaultValues: industry
      ? {
          id: industry.id,
          version: industry.version,
          name: industry.name,
          slug: industry.slug,
          iconKey: industry.iconKey,
          tagline: industry.tagline ?? undefined,
          order: industry.order,
          visible: industry.visible,
          challenges: [],
          solutionMappings: [],
          faqs: [],
        }
      : {
          name: '',
          slug: '',
          iconKey: '',
          order: 0,
          visible: true,
          challenges: [],
          solutionMappings: [],
          faqs: [],
        },
  });

  const challenges = useFieldArray({ control, name: 'challenges' });
  const nameValue = watch('name');

  async function onSubmit(values: UpsertIndustryInput): Promise<void> {
    setSubmitting(true);
    setFormError(null);
    setConflict(false);

    const result = await upsertIndustry(values);
    setSubmitting(false);

    if (!result.ok) {
      if (result.error.code === 'CONFLICT') {
        setConflict(true);
        return;
      }
      setFormError(result.error.message);
      return;
    }
    router.push('/admin/industries');
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="flex flex-col gap-6" noValidate>
        {industry && <input type="hidden" {...register('id')} />}
        {industry && <input type="hidden" {...register('version', { valueAsNumber: true })} />}

        {formError && <Alert tone="error">{formError}</Alert>}
        {conflict && (
          <Alert tone="error">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span>This industry was changed by someone else since you opened it.</span>
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
                if (!industry && !watch('slug')) setValue('slug', slugify(nameValue ?? ''));
              },
            })}
          />
          <FormField label="Slug" required error={errors.slug?.message} {...register('slug')} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Icon" required hint="A Lucide icon name." error={errors.iconKey?.message} {...register('iconKey')} />
          <FormField label="Order" type="number" {...register('order', { valueAsNumber: true })} />
        </div>

        <FormField label="Tagline" hint="Shown on the industry tile." {...register('tagline')} />

        <fieldset className="flex flex-col gap-3">
          <legend className="text-small font-semibold text-[color:var(--color-text-primary)]">Challenges</legend>
          {challenges.fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
              <input
                placeholder="Icon"
                className="h-11 w-32 rounded-md border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] px-3 text-small"
                {...register(`challenges.${index}.iconKey` as const)}
              />
              <input
                placeholder="Challenge description"
                className="h-11 flex-1 rounded-md border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] px-3 text-body"
                {...register(`challenges.${index}.label` as const)}
              />
              <button
                type="button"
                onClick={() => challenges.remove(index)}
                aria-label="Remove challenge"
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
            onClick={() => challenges.append({ iconKey: '', label: '', order: challenges.fields.length })}
            className="w-fit"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add challenge
          </Button>
        </fieldset>

        <label className="flex items-center gap-2 text-small text-[color:var(--color-text-body)]">
          <input type="checkbox" {...register('visible')} className="h-4 w-4 rounded border-[color:var(--color-border-default)]" />
          Visible on the public site
        </label>

        <div className="flex justify-end gap-3 border-t border-[color:var(--color-border-default)] pt-4">
          <Button type="button" variant="secondary" onClick={() => router.push('/admin/industries')}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            {industry ? 'Save changes' : 'Create industry'}
          </Button>
        </div>
      </form>

      {industry && <VersionHistoryPanel entity="INDUSTRY" entityId={industry.id} />}
    </div>
  );
}
