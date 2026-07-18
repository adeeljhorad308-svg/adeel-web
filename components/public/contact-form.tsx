'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { submitContactForm } from '@/lib/actions/contact-actions';
import { contactFormSchema, type ContactFormInput } from '@/lib/validation/contact';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Alert } from '@/components/ui/alert';

/** Public contact form (Stage 3 Page 11). Honeypot field hidden via CSS, never shown to real users. */
export function ContactForm(): React.ReactElement {
  const [submitted, setSubmitted] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactFormInput>({ resolver: zodResolver(contactFormSchema) });

  async function onSubmit(values: ContactFormInput): Promise<void> {
    setSubmitting(true);
    setFormError(null);
    const result = await submitContactForm(values);
    setSubmitting(false);
    if (!result.ok) {
      setFormError(result.error.message);
      return;
    }
    setSubmitted(true);
  }

  if (submitted) {
    return <Alert tone="success">Thanks — we&apos;ll reply within 24 hours.</Alert>;
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(onSubmit)(e)}
      noValidate
      className="flex flex-col gap-4 rounded-lg border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] p-6 shadow-sm"
    >
      {formError && <Alert tone="error">{formError}</Alert>}
      <input
        type="text"
        tabIndex={-1}
        autoComplete="off"
        className="sr-only"
        {...register('website')}
        aria-hidden="true"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Name" required error={errors.name?.message} {...register('name')} />
        <FormField
          label="Email"
          type="email"
          required
          error={errors.email?.message}
          {...register('email')}
        />
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <FormField label="Company" {...register('company')} />
        <FormField label="Phone" {...register('phone')} />
      </div>
      <FormField label="Service interest" {...register('serviceInterest')} />
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="message"
          className="text-small font-semibold text-[color:var(--color-text-primary)]"
        >
          Message
        </label>
        <textarea
          id="message"
          rows={5}
          required
          className="rounded-md border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-page)] p-3 text-body"
          {...register('message')}
        />
        {errors.message && (
          <p className="text-small font-medium text-[color:var(--color-feedback-error)]">
            {errors.message.message}
          </p>
        )}
      </div>
      <Button type="submit" loading={submitting} className="w-full">
        Send message
      </Button>
    </form>
  );
}
