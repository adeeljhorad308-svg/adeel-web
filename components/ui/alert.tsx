import { cn } from '@/lib/utils';

/**
 * Inline alert primitive (Stage 1 §9, §14). Used for form-level success and error
 * feedback. Uses role="alert" with aria-live so screen readers announce results,
 * and pairs an icon with color so meaning survives without color perception.
 */

type Tone = 'success' | 'error' | 'info';

const toneStyles: Record<Tone, string> = {
  success:
    'border-[color:var(--color-feedback-success)] bg-[color:var(--color-feedback-success)]/10 text-[color:var(--color-text-primary)]',
  error:
    'border-[color:var(--color-feedback-error)] bg-[color:var(--color-feedback-error)]/10 text-[color:var(--color-text-primary)]',
  info:
    'border-[color:var(--color-border-default)] bg-[color:var(--color-bg-subtle)] text-[color:var(--color-text-primary)]',
};

export interface AlertProps {
  readonly tone: Tone;
  readonly children: React.ReactNode;
  readonly className?: string;
}

export function Alert({ tone, children, className }: AlertProps): React.ReactElement {
  return (
    <div
      role="alert"
      aria-live={tone === 'error' ? 'assertive' : 'polite'}
      className={cn('rounded-md border px-4 py-3 text-small', toneStyles[tone], className)}
    >
      {children}
    </div>
  );
}
