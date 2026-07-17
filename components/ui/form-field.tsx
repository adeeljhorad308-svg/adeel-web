import { forwardRef, useId } from 'react';
import { cn } from '@/lib/utils';

/**
 * Form field primitives (Stage 1 §9, §14). The FormField wires label, control,
 * hint, and error together with correct `htmlFor`/`aria-describedby`/`aria-invalid`
 * so every form is accessible by construction. Errors are conveyed by text and
 * color together — never color alone (WCAG 2.2 AA).
 *
 * FormField forwards its ref and any extra props (onChange, onBlur, name) to the
 * underlying input, so it composes cleanly with react-hook-form's `register()`.
 */

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  readonly invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { className, invalid, ...props },
  ref,
) {
  return (
    <input
      ref={ref}
      aria-invalid={invalid || undefined}
      className={cn(
        'h-11 w-full rounded-md border bg-[color:var(--color-bg-surface)] px-3 text-body text-[color:var(--color-text-primary)]',
        'placeholder:text-[color:var(--color-text-muted)] transition-colors duration-fast ease-out',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg-page)]',
        'disabled:cursor-not-allowed disabled:opacity-50',
        invalid
          ? 'border-[color:var(--color-feedback-error)]'
          : 'border-[color:var(--color-border-default)]',
        className,
      )}
      {...props}
    />
  );
});

export interface FormFieldProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'id'> {
  readonly label: string;
  readonly error?: string | undefined;
  readonly hint?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(function FormField(
  { label, name, type = 'text', required = false, error, hint, ...inputProps },
  ref,
) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-small font-semibold text-[color:var(--color-text-primary)]">
        {label}
        {required && (
          <span className="ml-0.5 text-[color:var(--color-feedback-error)]" aria-hidden="true">
            *
          </span>
        )}
      </label>
      <Input
        id={id}
        ref={ref}
        name={name}
        type={type}
        required={required}
        invalid={Boolean(error)}
        {...(describedBy ? { 'aria-describedby': describedBy } : {})}
        {...inputProps}
      />
      {hint && (
        <p id={hintId} className="text-small text-[color:var(--color-text-muted)]">
          {hint}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-small font-medium text-[color:var(--color-feedback-error)]">
          {error}
        </p>
      )}
    </div>
  );
});
