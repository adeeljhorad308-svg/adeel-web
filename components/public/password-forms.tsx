'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { requestPasswordReset, resetPassword } from '@/lib/services/auth-actions';
import {
  forgotPasswordSchema,
  resetPasswordSchema,
  type ForgotPasswordInput,
  type ResetPasswordInput,
} from '@/lib/validation/auth';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Alert } from '@/components/ui/alert';

/**
 * Password recovery forms (Stage 3 Zone B). The forgot form always shows the same
 * confirmation regardless of whether the email exists (no user enumeration). The
 * reset form validates the new password client- and server-side and routes to
 * login on success.
 */

export function ForgotPasswordForm(): React.ReactElement {
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordInput>({ resolver: zodResolver(forgotPasswordSchema) });

  async function onSubmit(values: ForgotPasswordInput): Promise<void> {
    setSubmitting(true);
    await requestPasswordReset(values);
    setSubmitting(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="font-display text-h3 font-bold text-[color:var(--color-text-primary)]">
          Check your email
        </h1>
        <Alert tone="success">
          If an account exists for that address, we&apos;ve sent a link to reset your password.
        </Alert>
        <Link
          href="/login"
          className="text-small text-[color:var(--color-brand-primary)] hover:underline"
        >
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-h3 font-bold text-[color:var(--color-text-primary)]">
          Reset your password
        </h1>
        <p className="mt-1 text-small text-[color:var(--color-text-muted)]">
          Enter your email and we&apos;ll send you a reset link.
        </p>
      </div>
      <form
        onSubmit={(e) => void handleSubmit(onSubmit)(e)}
        className="flex flex-col gap-4"
        noValidate
      >
        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          required
          error={errors.email?.message}
          {...register('email')}
        />
        <Button type="submit" loading={submitting} className="w-full">
          Send reset link
        </Button>
        <Link
          href="/login"
          className="text-center text-small text-[color:var(--color-brand-primary)] hover:underline"
        >
          Back to sign in
        </Link>
      </form>
    </div>
  );
}

export function ResetPasswordForm({ token }: { token: string }): React.ReactElement {
  const router = useRouter();
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { token, password: '', confirmPassword: '' },
  });

  async function onSubmit(values: ResetPasswordInput): Promise<void> {
    setSubmitting(true);
    setFormError(null);
    const result = await resetPassword(values);
    setSubmitting(false);
    if (!result.ok) {
      setFormError(result.error.message);
      return;
    }
    router.push('/login?reset=success');
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-h3 font-bold text-[color:var(--color-text-primary)]">
          Choose a new password
        </h1>
        <p className="mt-1 text-small text-[color:var(--color-text-muted)]">
          Your new password must be at least 12 characters.
        </p>
      </div>
      {formError && <Alert tone="error">{formError}</Alert>}
      <form
        onSubmit={(e) => void handleSubmit(onSubmit)(e)}
        className="flex flex-col gap-4"
        noValidate
      >
        <input type="hidden" {...register('token')} />
        <FormField
          label="New password"
          type="password"
          autoComplete="new-password"
          required
          error={errors.password?.message}
          {...register('password')}
        />
        <FormField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          required
          error={errors.confirmPassword?.message}
          {...register('confirmPassword')}
        />
        <Button type="submit" loading={submitting} className="w-full">
          Update password
        </Button>
      </form>
    </div>
  );
}
