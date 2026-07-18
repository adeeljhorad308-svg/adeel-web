'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { saveGlobalSeoConfig, saveSeoOverride, deleteSeoOverride } from '@/lib/actions/seo-actions';
import { globalSeoConfigSchema, type GlobalSeoConfigInput } from '@/lib/validation/seo';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Alert } from '@/components/ui/alert';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import type { GlobalSeoConfig, SeoOverride } from '@prisma/client';

/**
 * SEO Manager (Stage 4 §14). Global defaults apply everywhere; per-page
 * overrides take precedence for the specific path (resolved by
 * `resolveMetadata` in the service, used by every public page's metadata).
 */
export function SeoManagerClient({
  globalConfig,
  overrides: initialOverrides,
}: {
  globalConfig: GlobalSeoConfig | null;
  overrides: SeoOverride[];
}): React.ReactElement {
  const [overrides, setOverrides] = useState(initialOverrides);
  const [newPath, setNewPath] = useState('');
  const [pendingDelete, setPendingDelete] = useState<SeoOverride | null>(null);
  const [saved, setSaved] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit } = useForm<GlobalSeoConfigInput>({
    resolver: zodResolver(globalSeoConfigSchema),
    defaultValues: {
      defaultTitle: globalConfig?.defaultTitle ?? 'Adeel IT Solutions',
      titleTemplate: globalConfig?.titleTemplate ?? '%s — Adeel IT Solutions',
      defaultDescription: globalConfig?.defaultDescription ?? '',
      twitterHandle: globalConfig?.twitterHandle ?? undefined,
      robotsExtra: globalConfig?.robotsExtra ?? undefined,
    },
  });

  async function onSubmitGlobal(values: GlobalSeoConfigInput): Promise<void> {
    setSubmitting(true);
    const result = await saveGlobalSeoConfig(values);
    setSubmitting(false);
    setSaved(result.ok);
  }

  async function addOverride(): Promise<void> {
    if (!newPath.trim()) return;
    const result = await saveSeoOverride({ pagePath: newPath.trim(), noindex: false });
    if (result.ok) {
      setOverrides((prev) => [...prev, result.data]);
      setNewPath('');
    }
  }

  async function updateOverride(override: SeoOverride): Promise<void> {
    await saveSeoOverride(override);
  }

  function handleDelete(): void {
    if (!pendingDelete) return;
    void deleteSeoOverride(pendingDelete.pagePath).then((result) => {
      if (result.ok)
        setOverrides((prev) => prev.filter((o) => o.pagePath !== pendingDelete.pagePath));
      setPendingDelete(null);
    });
  }

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h2 className="font-display text-h4 font-bold text-[color:var(--color-text-primary)]">
          Global defaults
        </h2>
        <form
          onSubmit={(e) => void handleSubmit(onSubmitGlobal)(e)}
          className="mt-4 flex max-w-xl flex-col gap-4"
        >
          {saved && <Alert tone="success">Global SEO settings saved.</Alert>}
          <FormField label="Default title" required {...register('defaultTitle')} />
          <FormField
            label="Title template"
            hint="Use %s as the page-title placeholder."
            required
            {...register('titleTemplate')}
          />
          <FormField
            label="Default description"
            hint="Max 160 characters."
            {...register('defaultDescription')}
          />
          <FormField label="Twitter handle" {...register('twitterHandle')} />
          <FormField label="Additional robots.txt directives" {...register('robotsExtra')} />
          <Button type="submit" loading={submitting} className="w-fit">
            Save global defaults
          </Button>
        </form>
      </section>

      <section>
        <h2 className="font-display text-h4 font-bold text-[color:var(--color-text-primary)]">
          Per-page overrides
        </h2>
        <div className="mt-4 flex flex-col gap-3">
          {overrides.map((override) => (
            <div
              key={override.pagePath}
              className="rounded-lg border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] p-4"
            >
              <div className="flex items-center justify-between">
                <p className="font-mono text-small font-semibold text-[color:var(--color-text-primary)]">
                  {override.pagePath}
                </p>
                <button
                  onClick={() => setPendingDelete(override)}
                  aria-label={`Remove override for ${override.pagePath}`}
                  className="rounded-md p-2 text-[color:var(--color-feedback-error)] hover:bg-[color:var(--color-bg-subtle)]"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <input
                  defaultValue={override.title ?? ''}
                  onBlur={(e) => void updateOverride({ ...override, title: e.target.value })}
                  placeholder="Title override"
                  className="h-10 rounded-md border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-page)] px-3 text-small"
                />
                <input
                  defaultValue={override.description ?? ''}
                  onBlur={(e) => void updateOverride({ ...override, description: e.target.value })}
                  placeholder="Description override"
                  className="h-10 rounded-md border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-page)] px-3 text-small"
                />
              </div>
              <label className="mt-2 flex items-center gap-2 text-small text-[color:var(--color-text-muted)]">
                <input
                  type="checkbox"
                  defaultChecked={override.noindex}
                  onChange={(e) => void updateOverride({ ...override, noindex: e.target.checked })}
                  className="h-4 w-4 rounded border-[color:var(--color-border-default)]"
                />
                No-index this page
              </label>
            </div>
          ))}
          <div className="flex items-center gap-2">
            <input
              value={newPath}
              onChange={(e) => setNewPath(e.target.value)}
              placeholder="/services/web-development"
              className="h-10 flex-1 rounded-md border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] px-3 text-small"
            />
            <Button variant="secondary" onClick={() => void addOverride()}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add override
            </Button>
          </div>
        </div>
      </section>

      <ConfirmDialog
        open={pendingDelete !== null}
        title={`Remove override for "${pendingDelete?.pagePath}"?`}
        description="This page will fall back to the global SEO defaults."
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
      />
    </div>
  );
}
