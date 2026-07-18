'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { saveFooterConfig } from '@/lib/actions/footer-actions';
import { footerConfigSchema, type FooterConfigInput } from '@/lib/validation/footer';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Alert } from '@/components/ui/alert';

/**
 * Footer Builder (Stage 4 §13). Columns and their links are edited as a nested
 * field array. Social links and contact details live in Settings (Stage 4 §17);
 * this module owns the link columns, copyright, and newsletter toggle only —
 * keeping each module's write surface narrow and predictable.
 */
export function FooterBuilderClient({
  initial,
}: {
  initial: FooterConfigInput;
}): React.ReactElement {
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, control, handleSubmit } = useForm<FooterConfigInput>({
    resolver: zodResolver(footerConfigSchema),
    defaultValues: initial,
  });
  const {
    fields: columns,
    append: appendColumn,
    remove: removeColumn,
  } = useFieldArray({
    control,
    name: 'columns',
  });

  async function onSubmit(values: FooterConfigInput): Promise<void> {
    setSubmitting(true);
    const result = await saveFooterConfig(values);
    setSubmitting(false);
    setSaved(result.ok);
  }

  return (
    <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="flex flex-col gap-6">
      {saved && <Alert tone="success">Footer saved.</Alert>}

      <FormField label="Copyright text" {...register('copyright')} />

      <label className="flex items-center gap-2 text-small text-[color:var(--color-text-body)]">
        <input
          type="checkbox"
          {...register('showNewsletter')}
          className="h-4 w-4 rounded border-[color:var(--color-border-default)]"
        />
        Show newsletter signup
      </label>

      <div className="flex flex-col gap-4">
        {columns.map((column, columnIndex) => (
          <FooterColumnEditor
            key={column.id}
            control={control}
            register={register}
            columnIndex={columnIndex}
            onRemoveColumn={() => removeColumn(columnIndex)}
          />
        ))}
        <Button
          type="button"
          variant="secondary"
          onClick={() => appendColumn({ title: '', links: [] })}
          className="w-fit"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add column
        </Button>
      </div>

      <div className="border-t border-[color:var(--color-border-default)] pt-4">
        <Button type="submit" loading={submitting}>
          Save footer
        </Button>
      </div>
    </form>
  );
}

function FooterColumnEditor({
  control,
  register,
  columnIndex,
  onRemoveColumn,
}: {
  control: ReturnType<typeof useForm<FooterConfigInput>>['control'];
  register: ReturnType<typeof useForm<FooterConfigInput>>['register'];
  columnIndex: number;
  onRemoveColumn: () => void;
}): React.ReactElement {
  const {
    fields: links,
    append,
    remove,
  } = useFieldArray({
    control,
    name: `columns.${columnIndex}.links`,
  });

  return (
    <div className="rounded-lg border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] p-4">
      <div className="flex items-center gap-3">
        <input
          className="h-10 flex-1 rounded-md border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-page)] px-2 text-small font-semibold"
          placeholder="Column title"
          {...register(`columns.${columnIndex}.title` as const)}
        />
        <button
          type="button"
          onClick={onRemoveColumn}
          aria-label="Remove column"
          className="rounded-md p-2 text-[color:var(--color-feedback-error)] hover:bg-[color:var(--color-bg-subtle)]"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
      <div className="mt-3 flex flex-col gap-2">
        {links.map((link, linkIndex) => (
          <div key={link.id} className="flex items-center gap-2">
            <input
              className="h-9 flex-1 rounded-md border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-page)] px-2 text-small"
              placeholder="Label"
              {...register(`columns.${columnIndex}.links.${linkIndex}.label` as const)}
            />
            <input
              className="h-9 flex-1 rounded-md border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-page)] px-2 text-small"
              placeholder="/path or https://…"
              {...register(`columns.${columnIndex}.links.${linkIndex}.href` as const)}
            />
            <button
              type="button"
              onClick={() => remove(linkIndex)}
              aria-label="Remove link"
              className="rounded-md p-1.5 text-[color:var(--color-feedback-error)] hover:bg-[color:var(--color-bg-subtle)]"
            >
              <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        ))}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => append({ label: '', href: '' })}
          className="w-fit"
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Add link
        </Button>
      </div>
    </div>
  );
}
