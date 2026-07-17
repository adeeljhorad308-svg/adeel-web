import { forwardRef } from 'react';
import { cn } from '@/lib/utils';

/**
 * Button primitive (Stage 1 §9).
 *
 * Variants: primary, secondary, ghost, destructive. Sizes: sm/md/lg with a 44px
 * minimum touch target at md/lg. States (hover, focus-visible, disabled, loading)
 * are token-driven so the Theme Manager can re-theme without touching this file.
 * Loading disables interaction and shows a spinner while preserving layout width.
 */

type Variant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type Size = 'sm' | 'md' | 'lg';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  readonly variant?: Variant;
  readonly size?: Size;
  readonly loading?: boolean;
}

const base =
  'inline-flex items-center justify-center gap-2 rounded-md font-medium transition-colors duration-fast ease-out ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-brand-primary)] focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-[color:var(--color-bg-page)] disabled:pointer-events-none disabled:opacity-50';

const variants: Record<Variant, string> = {
  primary:
    'bg-[color:var(--color-brand-primary)] text-white hover:bg-[color:var(--color-brand-hover)]',
  secondary:
    'border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] ' +
    'text-[color:var(--color-text-primary)] hover:border-[color:var(--color-brand-primary)]',
  ghost:
    'text-[color:var(--color-text-primary)] hover:bg-[color:var(--color-bg-subtle)]',
  destructive: 'bg-[color:var(--color-feedback-error)] text-white hover:opacity-90',
};

const sizes: Record<Size, string> = {
  sm: 'h-9 px-3 text-small',
  md: 'h-11 px-5 text-body',
  lg: 'h-[52px] px-6 text-body-lg',
};

function Spinner(): React.ReactElement {
  return (
    <svg
      className="h-4 w-4 animate-spin"
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, disabled, children, className, ...props },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      {...props}
    >
      {loading && <Spinner />}
      {children}
    </button>
  );
});
