'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { saveNavigationMenu } from '@/lib/actions/navigation-actions';
import { saveNavigationMenuSchema, type SaveNavigationMenuInput } from '@/lib/validation/navigation';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import type { NavigationMenu, NavigationItem } from '@prisma/client';

/**
 * Navigation Builder (Stage 4 §12). Reordering is button-driven (move up/down)
 * rather than drag-only, so it is fully keyboard-operable with no separate
 * fallback path needed (Stage 4 §12 self-review requirement). Validated with
 * the same Zod schema on both client (immediate feedback) and server
 * (authoritative — internal-link and URL checks are re-verified there).
 */
export function NavigationBuilderClient({
  context,
  menu,
}: {
  context: 'HEADER' | 'FOOTER';
  menu: (NavigationMenu & { items: NavigationItem[] }) | null;
}): React.ReactElement {
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const { register, control, handleSubmit, setError, formState: { errors } } = useForm<SaveNavigationMenuInput>({
    resolver: zodResolver(saveNavigationMenuSchema),
    defaultValues: {
      context,
      name: menu?.name ?? 'primary',
      items: (menu?.items ?? []).map((i) => ({
        id: i.id,
        label: i.label,
        type: i.type,
        href: i.href,
        iconKey: i.iconKey ?? undefined,
        order: i.order,
        visible: i.visible,
      })),
    },
  });

  const { fields, append, remove, move } = useFieldArray({ control, name: 'items' });

  async function onSubmit(values: SaveNavigationMenuInput): Promise<void> {
    setSubmitting(true);
    setFormError(null);
    setSaved(false);

    // Re-sequence order to match the current on-screen list.
    const withOrder = { ...values, items: values.items.map((item, index) => ({ ...item, order: index })) };
    const result = await saveNavigationMenu(withOrder);
    setSubmitting(false);

    if (!result.ok) {
      if (result.error.fields) {
        for (const [field, message] of Object.entries(result.error.fields)) {
          setError(field as keyof SaveNavigationMenuInput, { message });
        }
      }
      setFormError(result.error.message);
      return;
    }
    setSaved(true);
  }

  return (
    <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="flex flex-col gap-4" noValidate>
      {saved && <Alert tone="success">Menu saved.</Alert>}
      {formError && <Alert tone="error">{formError}</Alert>}

      <ul className="flex flex-col gap-3">
        {fields.map((field, index) => (
          <li
            key={field.id}
            className="flex flex-col gap-3 rounded-lg border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] p-4 sm:flex-row sm:items-end"
          >
            <div className="flex flex-1 flex-col gap-3 sm:flex-row">
              <div className="flex flex-1 flex-col gap-1">
                <label className="text-small font-medium text-[color:var(--color-text-body)]">Label</label>
                <input
                  className="h-10 rounded-md border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-page)] px-2 text-small"
                  {...register(`items.${index}.label` as const)}
                />
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <label className="text-small font-medium text-[color:var(--color-text-body)]">Link</label>
                <input
                  className="h-10 rounded-md border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-page)] px-2 text-small"
                  {...register(`items.${index}.href` as const)}
                />
                {errors.items?.[index]?.href && (
                  <p className="text-small text-[color:var(--color-feedback-error)]">
                    {errors.items[index]?.href?.message}
                  </p>
                )}
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-small font-medium text-[color:var(--color-text-body)]">Type</label>
                <select
                  className="h-10 rounded-md border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-page)] px-2 text-small"
                  {...register(`items.${index}.type` as const)}
                >
                  <option value="INTERNAL">Internal</option>
                  <option value="EXTERNAL">External</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => move(index, Math.max(0, index - 1))}
                disabled={index === 0}
                aria-label={`Move ${field.label} up`}
                className="rounded-md p-2 text-[color:var(--color-text-body)] hover:bg-[color:var(--color-bg-subtle)] disabled:opacity-30"
              >
                <ArrowUp className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => move(index, Math.min(fields.length - 1, index + 1))}
                disabled={index === fields.length - 1}
                aria-label={`Move ${field.label} down`}
                className="rounded-md p-2 text-[color:var(--color-text-body)] hover:bg-[color:var(--color-bg-subtle)] disabled:opacity-30"
              >
                <ArrowDown className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => remove(index)}
                aria-label={`Remove ${field.label}`}
                className="rounded-md p-2 text-[color:var(--color-feedback-error)] hover:bg-[color:var(--color-bg-subtle)]"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </li>
        ))}
      </ul>

      <Button
        type="button"
        variant="secondary"
        onClick={() => append({ label: '', type: 'INTERNAL', href: '/', order: fields.length, visible: true })}
        className="w-fit"
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Add menu item
      </Button>

      <div className="border-t border-[color:var(--color-border-default)] pt-4">
        <Button type="submit" loading={submitting}>
          Save menu
        </Button>
      </div>
    </form>
  );
}
