'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { upsertProject } from '@/lib/actions/portfolio-actions';
import { upsertProjectSchema, type UpsertProjectInput } from '@/lib/validation/portfolio';
import { slugify } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Alert } from '@/components/ui/alert';
import { VersionHistoryPanel } from '@/components/admin/version-history-panel';
import type { Project } from '@prisma/client';

/**
 * Project editor (Stage 4 §3). The richest editor: narrative blocks (challenge /
 * approach / solution), metrics (only real, optional numbers — never fabricated),
 * status lifecycle, and featured flag. Same optimistic-locking conflict handling
 * as Services and Industries.
 */
export function ProjectEditorForm({ project }: { project?: Project }): React.ReactElement {
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
  } = useForm<UpsertProjectInput>({
    resolver: zodResolver(upsertProjectSchema),
    defaultValues: project
      ? {
          id: project.id,
          version: project.version,
          title: project.title,
          slug: project.slug,
          clientName: project.clientName ?? undefined,
          status: project.status,
          featured: project.featured,
          order: project.order,
          liveUrl: project.liveUrl ?? undefined,
          githubUrl: project.githubUrl ?? undefined,
          overview: project.overview ?? undefined,
          narratives: [],
          metrics: [],
          media: [],
          technologyIds: [],
        }
      : {
          title: '',
          slug: '',
          status: 'DRAFT',
          featured: false,
          order: 0,
          narratives: [],
          metrics: [],
          media: [],
          technologyIds: [],
        },
  });

  const narratives = useFieldArray({ control, name: 'narratives' });
  const metrics = useFieldArray({ control, name: 'metrics' });
  const titleValue = watch('title');

  async function onSubmit(values: UpsertProjectInput): Promise<void> {
    setSubmitting(true);
    setFormError(null);
    setConflict(false);

    const result = await upsertProject(values);
    setSubmitting(false);

    if (!result.ok) {
      if (result.error.code === 'CONFLICT') {
        setConflict(true);
        return;
      }
      setFormError(result.error.message);
      return;
    }
    router.push('/admin/portfolio');
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={(e) => void handleSubmit(onSubmit)(e)}
        className="flex flex-col gap-6"
        noValidate
      >
        {project && <input type="hidden" {...register('id')} />}
        {project && <input type="hidden" {...register('version', { valueAsNumber: true })} />}

        {formError && <Alert tone="error">{formError}</Alert>}
        {conflict && (
          <Alert tone="error">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span>This project was changed by someone else since you opened it.</span>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={() => window.location.reload()}
              >
                Reload page
              </Button>
            </div>
          </Alert>
        )}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField
            label="Title"
            required
            error={errors.title?.message}
            {...register('title', {
              onBlur: () => {
                if (!project && !watch('slug')) setValue('slug', slugify(titleValue ?? ''));
              },
            })}
          />
          <FormField label="Slug" required error={errors.slug?.message} {...register('slug')} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <FormField label="Client name" {...register('clientName')} />
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="status"
              className="text-small font-semibold text-[color:var(--color-text-primary)]"
            >
              Status
            </label>
            <select
              id="status"
              className="h-11 rounded-md border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] px-3 text-body"
              {...register('status')}
            >
              <option value="DRAFT">Draft</option>
              <option value="PUBLISHED">Published</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>
          <FormField label="Order" type="number" {...register('order', { valueAsNumber: true })} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <FormField label="Live demo URL" {...register('liveUrl')} />
          <FormField label="GitHub URL" {...register('githubUrl')} />
        </div>

        <label className="flex items-center gap-2 text-small text-[color:var(--color-text-body)]">
          <input
            type="checkbox"
            {...register('featured')}
            className="h-4 w-4 rounded border-[color:var(--color-border-default)]"
          />
          Featured project
        </label>

        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="overview"
            className="text-small font-semibold text-[color:var(--color-text-primary)]"
          >
            Overview
          </label>
          <textarea
            id="overview"
            rows={4}
            className="w-full rounded-md border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] p-3 text-body"
            {...register('overview')}
          />
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="text-small font-semibold text-[color:var(--color-text-primary)]">
            Narrative
          </legend>
          {narratives.fields.map((field, index) => (
            <div
              key={field.id}
              className="flex flex-col gap-2 rounded-md border border-[color:var(--color-border-default)] p-3"
            >
              <div className="flex items-center justify-between">
                <select
                  className="h-9 rounded-md border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-page)] px-2 text-small"
                  {...register(`narratives.${index}.type` as const)}
                >
                  <option value="OVERVIEW">Overview</option>
                  <option value="CHALLENGE">Challenge</option>
                  <option value="APPROACH">Approach</option>
                  <option value="SOLUTION">Solution</option>
                </select>
                <button
                  type="button"
                  onClick={() => narratives.remove(index)}
                  aria-label="Remove narrative section"
                  className="rounded-md p-1.5 text-[color:var(--color-feedback-error)] hover:bg-[color:var(--color-bg-subtle)]"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <textarea
                rows={3}
                className="w-full rounded-md border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-page)] p-2 text-small"
                {...register(`narratives.${index}.bodyRich` as const)}
              />
            </div>
          ))}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              narratives.append({ type: 'OVERVIEW', bodyRich: '', order: narratives.fields.length })
            }
            className="w-fit"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add narrative section
          </Button>
        </fieldset>

        <fieldset className="flex flex-col gap-3">
          <legend className="text-small font-semibold text-[color:var(--color-text-primary)]">
            Results (only add real, verified numbers)
          </legend>
          {metrics.fields.map((field, index) => (
            <div key={field.id} className="flex items-center gap-2">
              <input
                placeholder="Label, e.g. Checkout time reduced"
                className="h-10 flex-1 rounded-md border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] px-3 text-small"
                {...register(`metrics.${index}.label` as const)}
              />
              <input
                placeholder="Value, e.g. 40%"
                className="h-10 w-32 rounded-md border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] px-3 text-small"
                {...register(`metrics.${index}.value` as const)}
              />
              <button
                type="button"
                onClick={() => metrics.remove(index)}
                aria-label="Remove metric"
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
            onClick={() => metrics.append({ label: '', value: '', order: metrics.fields.length })}
            className="w-fit"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add result
          </Button>
        </fieldset>

        <div className="flex justify-end gap-3 border-t border-[color:var(--color-border-default)] pt-4">
          <Button type="button" variant="secondary" onClick={() => router.push('/admin/portfolio')}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            {project ? 'Save changes' : 'Create project'}
          </Button>
        </div>
      </form>

      {project && <VersionHistoryPanel entity="PROJECT" entityId={project.id} />}
    </div>
  );
}
