'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { upsertPost } from '@/lib/actions/blog-actions';
import { upsertPostSchema, type UpsertPostInput } from '@/lib/validation/blog';
import { slugify, estimateReadingTime } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Alert } from '@/components/ui/alert';
import { VersionHistoryPanel } from '@/components/admin/version-history-panel';
import type { Post } from '@prisma/client';

/**
 * Post editor (Stage 4 §7). The rich-content field is a textarea accepting HTML
 * in this scaffold (a WYSIWYG toolbar is a pure frontend enhancement layered on
 * top of the same `contentRich` field — not a schema or security change, so it's
 * safe to defer without weakening anything). Reading time is estimated live for
 * staff feedback; the server recomputes it authoritatively on save regardless.
 */
export function PostEditorForm({ post }: { post?: Post }): React.ReactElement {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UpsertPostInput>({
    resolver: zodResolver(upsertPostSchema),
    defaultValues: post
      ? {
          id: post.id,
          version: post.version,
          title: post.title,
          slug: post.slug,
          excerpt: post.excerpt ?? undefined,
          contentRich: post.contentRich,
          status: post.status,
          scheduledAt: post.scheduledAt ?? undefined,
          featured: post.featured,
          seoTitle: post.seoTitle ?? undefined,
          seoDescription: post.seoDescription ?? undefined,
          tagIds: [],
          relatedPostIds: [],
        }
      : {
          title: '',
          slug: '',
          contentRich: '',
          status: 'DRAFT',
          featured: false,
          tagIds: [],
          relatedPostIds: [],
        },
  });

  const titleValue = watch('title');
  const contentValue = watch('contentRich');
  const statusValue = watch('status');
  const estimatedMinutes = estimateReadingTime(contentValue ?? '');

  async function onSubmit(values: UpsertPostInput): Promise<void> {
    setSubmitting(true);
    setFormError(null);
    setConflict(false);

    const result = await upsertPost(values);
    setSubmitting(false);

    if (!result.ok) {
      if (result.error.code === 'CONFLICT') {
        setConflict(true);
        return;
      }
      setFormError(result.error.message);
      return;
    }
    router.push('/admin/blog');
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <form
        onSubmit={(e) => void handleSubmit(onSubmit)(e)}
        className="flex flex-col gap-6"
        noValidate
      >
        {post && <input type="hidden" {...register('id')} />}
        {post && <input type="hidden" {...register('version', { valueAsNumber: true })} />}

        {formError && <Alert tone="error">{formError}</Alert>}
        {conflict && (
          <Alert tone="error">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <span>This article was changed by someone else since you opened it.</span>
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
                if (!post && !watch('slug')) setValue('slug', slugify(titleValue ?? ''));
              },
            })}
          />
          <FormField label="Slug" required error={errors.slug?.message} {...register('slug')} />
        </div>

        <FormField
          label="Excerpt"
          hint="Shown on the blog listing card."
          {...register('excerpt')}
        />

        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="contentRich"
              className="text-small font-semibold text-[color:var(--color-text-primary)]"
            >
              Content
            </label>
            <span className="text-small text-[color:var(--color-text-muted)]">
              Estimated reading time: {estimatedMinutes} min
            </span>
          </div>
          <textarea
            id="contentRich"
            rows={16}
            required
            className="w-full rounded-md border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] p-3 font-mono text-small text-[color:var(--color-text-primary)]"
            {...register('contentRich')}
          />
          {errors.contentRich && (
            <p className="text-small font-medium text-[color:var(--color-feedback-error)]">
              {errors.contentRich.message}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
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
              <option value="SCHEDULED">Scheduled</option>
            </select>
          </div>
          {statusValue === 'SCHEDULED' && (
            <FormField
              label="Publish at"
              type="datetime-local"
              required
              error={errors.scheduledAt?.message}
              {...register('scheduledAt')}
            />
          )}
        </div>

        <label className="flex items-center gap-2 text-small text-[color:var(--color-text-body)]">
          <input
            type="checkbox"
            {...register('featured')}
            className="h-4 w-4 rounded border-[color:var(--color-border-default)]"
          />
          Featured article
        </label>

        <fieldset className="flex flex-col gap-3 rounded-md border border-[color:var(--color-border-default)] p-4">
          <legend className="px-1 text-small font-semibold text-[color:var(--color-text-primary)]">
            SEO
          </legend>
          <FormField
            label="SEO title"
            hint="Max 70 characters."
            error={errors.seoTitle?.message}
            {...register('seoTitle')}
          />
          <FormField
            label="SEO description"
            hint="Max 160 characters."
            error={errors.seoDescription?.message}
            {...register('seoDescription')}
          />
        </fieldset>

        <div className="flex justify-end gap-3 border-t border-[color:var(--color-border-default)] pt-4">
          <Button type="button" variant="secondary" onClick={() => router.push('/admin/blog')}>
            Cancel
          </Button>
          <Button type="submit" loading={submitting}>
            {post ? 'Save changes' : 'Create article'}
          </Button>
        </div>
      </form>

      {post && <VersionHistoryPanel entity="POST" entityId={post.id} />}
    </div>
  );
}
