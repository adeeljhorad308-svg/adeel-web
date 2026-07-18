'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { login, loginWithTwoFactor } from '@/lib/services/auth-actions';
import { loginSchema, type LoginInput } from '@/lib/validation/auth';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/ui/form-field';
import { Alert } from '@/components/ui/alert';

/**
 * Login form (Stage 3 Zone B). Two-step: password first, then a TOTP code only if
 * the account has 2FA enabled. Validation is client-side (RHF + Zod) mirrored by
 * server-side validation in the actions. On success, routes to the callbackUrl or
 * the admin dashboard.
 */
export function LoginForm(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl') ?? '/admin';

  const [stage, setStage] = useState<'credentials' | 'twoFactor'>('credentials');
  const [formError, setFormError] = useState<string | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '', rememberMe: false },
  });

  async function onSubmitCredentials(values: LoginInput): Promise<void> {
    setSubmitting(true);
    setFormError(null);
    const result = await login(values);
    setSubmitting(false);

    if (!result.ok) {
      setFormError(result.error.message);
      return;
    }
    if (result.data.requiresTwoFactor) {
      setStage('twoFactor');
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  async function onSubmitTwoFactor(event: React.FormEvent): Promise<void> {
    event.preventDefault();
    setSubmitting(true);
    setFormError(null);
    const values = getValues();
    const result = await loginWithTwoFactor({ ...values, code: twoFactorCode });
    setSubmitting(false);

    if (!result.ok) {
      setFormError(result.error.message);
      return;
    }
    router.push(callbackUrl);
    router.refresh();
  }

  if (stage === 'twoFactor') {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="font-display text-h3 font-bold text-[color:var(--color-text-primary)]">
            Enter your code
          </h1>
          <p className="mt-1 text-small text-[color:var(--color-text-muted)]">
            Open your authenticator app and enter the 6-digit code.
          </p>
        </div>
        {formError && <Alert tone="error">{formError}</Alert>}
        <form
          onSubmit={(e) => void onSubmitTwoFactor(e)}
          className="flex flex-col gap-4"
          noValidate
        >
          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="totp"
              className="text-small font-semibold text-[color:var(--color-text-primary)]"
            >
              Authentication code
            </label>
            <input
              id="totp"
              name="code"
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={twoFactorCode}
              onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
              className="h-11 w-full rounded-md border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] px-3 text-center text-body tracking-[0.5em] text-[color:var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg-page)]"
            />
          </div>
          <Button type="submit" loading={submitting} className="w-full">
            Verify and sign in
          </Button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-display text-h3 font-bold text-[color:var(--color-text-primary)]">
          Sign in
        </h1>
        <p className="mt-1 text-small text-[color:var(--color-text-muted)]">
          Access the Adeel IT Solutions dashboard.
        </p>
      </div>
      {formError && <Alert tone="error">{formError}</Alert>}
      <form
        onSubmit={(e) => void handleSubmit(onSubmitCredentials)(e)}
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
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <label
              htmlFor="password"
              className="text-small font-semibold text-[color:var(--color-text-primary)]"
            >
              Password
            </label>
            <Link
              href="/forgot-password"
              className="text-small text-[color:var(--color-brand-primary)] hover:underline"
            >
              Forgot password?
            </Link>
          </div>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            aria-invalid={Boolean(errors.password) || undefined}
            className="h-11 w-full rounded-md border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] px-3 text-body text-[color:var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg-page)]"
            {...register('password')}
          />
          {errors.password && (
            <p className="text-small font-medium text-[color:var(--color-feedback-error)]">
              {errors.password.message}
            </p>
          )}
        </div>
        <label className="flex items-center gap-2 text-small text-[color:var(--color-text-body)]">
          <input
            type="checkbox"
            {...register('rememberMe')}
            className="h-4 w-4 rounded border-[color:var(--color-border-default)]"
          />
          Keep me signed in
        </label>
        <Button type="submit" loading={submitting} className="w-full">
          Sign in
        </Button>
      </form>
    </div>
  );
}
