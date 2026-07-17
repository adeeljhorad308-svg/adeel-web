'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { saveThemeConfig } from '@/lib/actions/theme-actions';
import { themeConfigSchema, type ThemeConfigInput } from '@/lib/validation/theme';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';

const TOKEN_LABELS: Record<string, string> = {
  'bg-page': 'Page background',
  'bg-surface': 'Surface background',
  'bg-subtle': 'Subtle background',
  'text-primary': 'Primary text',
  'text-body': 'Body text',
  'text-muted': 'Muted text',
  'border-default': 'Border',
  'brand-primary': 'Brand primary',
  'brand-hover': 'Brand hover',
  'brand-tint': 'Brand tint',
  'feedback-success': 'Success',
  'feedback-warning': 'Warning',
  'feedback-error': 'Error',
};

/**
 * Theme Manager (Stage 4 §11). Edits semantic (Tier 2) color tokens for light and
 * dark mode. The server re-validates WCAG AA contrast on save and returns
 * field-level errors if a pairing fails — the Theme Manager cannot publish an
 * inaccessible palette. A live preview renders sample components against the
 * in-progress values so the effect is visible before saving.
 */
export function ThemeManagerClient({
  initial,
}: {
  initial: { light: Record<string, string>; dark: Record<string, string> };
}): React.ReactElement {
  const [mode, setMode] = useState<'light' | 'dark'>('light');
  const [saved, setSaved] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setError,
    formState: { errors },
  } = useForm<ThemeConfigInput>({
    resolver: zodResolver(themeConfigSchema),
    defaultValues: {
      tokensLight: initial.light as ThemeConfigInput['tokensLight'],
      tokensDark: initial.dark as ThemeConfigInput['tokensDark'],
      defaultMode: 'system',
    },
  });

  const previewTokens = watch(mode === 'light' ? 'tokensLight' : 'tokensDark');

  async function onSubmit(values: ThemeConfigInput): Promise<void> {
    setSubmitting(true);
    setFormError(null);
    setSaved(false);
    const result = await saveThemeConfig(values);
    setSubmitting(false);

    if (!result.ok) {
      if (result.error.fields) {
        for (const [field, message] of Object.entries(result.error.fields)) {
          setError(field as keyof ThemeConfigInput, { message });
        }
      }
      setFormError(result.error.message);
      return;
    }
    setSaved(true);
  }

  return (
    <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="grid grid-cols-1 gap-6 lg:grid-cols-2" noValidate>
      <div className="flex flex-col gap-4">
        {saved && <Alert tone="success">Theme saved. Changes apply site-wide immediately.</Alert>}
        {formError && <Alert tone="error">{formError}</Alert>}

        <div role="tablist" className="flex gap-1 border-b border-[color:var(--color-border-default)]">
          {(['light', 'dark'] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={`px-4 py-2 text-small font-medium capitalize ${
                mode === m
                  ? 'border-b-2 border-[color:var(--color-brand-primary)] text-[color:var(--color-brand-primary)]'
                  : 'text-[color:var(--color-text-muted)]'
              }`}
            >
              {m} mode
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {Object.entries(TOKEN_LABELS).map(([key, label]) => {
            const fieldName = `tokens${mode === 'light' ? 'Light' : 'Dark'}.${key}` as keyof ThemeConfigInput;
            const errorMessage = (errors.tokensLight as Record<string, { message?: string }> | undefined)?.[key]
              ?.message;
            return (
              <div key={key} className="flex flex-col gap-1">
                <label htmlFor={fieldName} className="text-small font-medium text-[color:var(--color-text-body)]">
                  {label}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    id={fieldName}
                    type="color"
                    className="h-9 w-9 shrink-0 cursor-pointer rounded border border-[color:var(--color-border-default)]"
                    {...register(fieldName)}
                  />
                  <input
                    type="text"
                    className="h-9 flex-1 rounded-md border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] px-2 text-small"
                    {...register(fieldName)}
                  />
                </div>
                {errorMessage && (
                  <p className="text-small font-medium text-[color:var(--color-feedback-error)]">{errorMessage}</p>
                )}
              </div>
            );
          })}
        </div>

        <Button type="submit" loading={submitting} className="w-fit">
          Save theme
        </Button>
      </div>

      {/* Live preview pane */}
      <div
        className="rounded-lg border p-6"
        style={{
          backgroundColor: previewTokens?.['bg-page'],
          borderColor: previewTokens?.['border-default'],
        }}
      >
        <p className="mb-4 text-small font-semibold uppercase tracking-wide" style={{ color: previewTokens?.['text-muted'] }}>
          Live preview
        </p>
        <div
          className="rounded-lg border p-5"
          style={{ backgroundColor: previewTokens?.['bg-surface'], borderColor: previewTokens?.['border-default'] }}
        >
          <h3 className="text-lg font-bold" style={{ color: previewTokens?.['text-primary'] }}>
            Sample heading
          </h3>
          <p className="mt-2 text-sm" style={{ color: previewTokens?.['text-body'] }}>
            This is how body text will look with the selected palette.
          </p>
          <button
            type="button"
            className="mt-4 rounded-md px-4 py-2 text-sm font-medium text-white"
            style={{ backgroundColor: previewTokens?.['brand-primary'] }}
          >
            Primary button
          </button>
        </div>
      </div>
    </form>
  );
}
