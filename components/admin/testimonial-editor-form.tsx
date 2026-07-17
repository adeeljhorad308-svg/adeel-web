'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { upsertTestimonial } from '@/lib/actions/testimonials-actions';
import { upsertTestimonialSchema, type UpsertTestimonialInput } from '@/lib/validation/testimonials';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Alert } from '@/components/ui/alert';
import type { Testimonial } from '@prisma/client';

/** Testimonial editor (Stage 4 §6). Every field is staff-entered from a real
 *  client review — nothing here is ever auto-generated or fabricated. */
export function TestimonialEditorForm({ testimonial }: { testimonial?: Testimonial }): React.ReactElement {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [conflict, setConflict] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<UpsertTestimonialInput>({
    resolver: zodResolver(upsertTestimonialSchema),
    defaultValues: testimonial
      ? {
          id: testimonial.id,
          version: testimonial.version,
          clientName: testimonial.clientName,
          company: testimonial.company ?? undefined,
          country: testimonial.country ?? undefined,
          rating: testimonial.rating,
          reviewText: testimonial.reviewText,
          videoUrl: testimonial.videoUrl ?? undefined,
          status: testimonial.status,
          order: testimonial.order,
        }
      : { rating: 5, status: 'DRAFT', order: 0, clientName: '', reviewText: '' },
  });

  async function onSubmit(values: UpsertTestimonialInput): Promise<void> {
    setSubmitting(true);
    setFormError(null);
    setConflict(false);

    const result = await upsertTestimonial(values);
    setSubmitting(false);

    if (!result.ok) {
      if (result.error.code === 'CONFLICT') {
        setConflict(true);
        return;
      }
      setFormError(result.error.message);
      return;
    }
    router.push('/admin/testimonials');
    router.refresh();
  }

  return (
    <form onSubmit={(e) => void handleSubmit(onSubmit)(e)} className="flex max-w-2xl flex-col gap-6" noValidate>
      {testimonial && <input type="hidden" {...register('id')} />}
      {testimonial && <input type="hidden" {...register('version', { valueAsNumber: true })} />}

      {formError && <Alert tone="error">{formError}</Alert>}
      {conflict && (
        <Alert tone="error">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <span>This testimonial was changed by someone else since you opened it.</span>
            <Button type="button" variant="secondary" size="sm" onClick={() => window.location.reload()}>
              Reload page
            </Button>
          </div>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Client name" required error={errors.clientName?.message} {...register('clientName')} />
        <FormField label="Company" {...register('company')} />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <FormField label="Country" {...register('country')} />
        <div className="flex flex-col gap-1.5">
          <label htmlFor="rating" className="text-small font-semibold text-[color:var(--color-text-primary)]">
            Rating
          </label>
          <select
            id="rating"
            className="h-11 rounded-md border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] px-3 text-body"
            {...register('rating', { valueAsNumber: true })}
          >
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {n} / 5
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="status" className="text-small font-semibold text-[color:var(--color-text-primary)]">
            Status
          </label>
          <select
            id="status"
            className="h-11 rounded-md border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] px-3 text-body"
            {...register('status')}
          >
            <option value="DRAFT">Draft</option>
            <option value="PUBLISHED">Published</option>
          </select>
        </div>
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="reviewText" className="text-small font-semibold text-[color:var(--color-text-primary)]">
          Review
        </label>
        <textarea
          id="reviewText"
          rows={5}
          required
          className="w-full rounded-md border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] p-3 text-body"
          {...register('reviewText')}
        />
        {errors.reviewText && (
          <p className="text-small font-medium text-[color:var(--color-feedback-error)]">{errors.reviewText.message}</p>
        )}
      </div>

      <FormField label="Video URL (optional)" {...register('videoUrl')} />

      <div className="flex justify-end gap-3 border-t border-[color:var(--color-border-default)] pt-4">
        <Button type="button" variant="secondary" onClick={() => router.push('/admin/testimonials')}>
          Cancel
        </Button>
        <Button type="submit" loading={submitting}>
          {testimonial ? 'Save changes' : 'Add testimonial'}
        </Button>
      </div>
    </form>
  );
}
