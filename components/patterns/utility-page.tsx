import Link from 'next/link';
import { cn } from '@/lib/utils';

/**
 * Utility page shell (Stage 3 Batch G): one template, six variants.
 *
 * Centered, calm, on-brand, dependency-free so it renders even when app systems
 * fail (critical for the 500 and offline variants). Copy is direction, not mood
 * (frontend-design guidance): it says what happened and how to recover. The
 * illustration slot is decorative and aria-hidden; meaning lives in the text.
 */

export interface UtilityAction {
  readonly label: string;
  readonly href: string;
  readonly variant?: 'primary' | 'secondary';
}

export interface UtilityPageProps {
  readonly eyebrow: string;
  readonly title: string;
  readonly description: string;
  readonly actions: readonly UtilityAction[];
  readonly accent?: 'brand' | 'error' | 'warning' | 'muted';
}

const accentClass: Record<NonNullable<UtilityPageProps['accent']>, string> = {
  brand: 'text-[color:var(--color-brand-primary)]',
  error: 'text-[color:var(--color-feedback-error)]',
  warning: 'text-[color:var(--color-feedback-warning)]',
  muted: 'text-[color:var(--color-text-muted)]',
};

export function UtilityPage({
  eyebrow,
  title,
  description,
  actions,
  accent = 'brand',
}: UtilityPageProps): React.ReactElement {
  return (
    <main
      id="main-content"
      className="flex min-h-screen flex-col items-center justify-center bg-[color:var(--color-bg-page)] px-5 text-center"
    >
      <div className="w-full max-w-[560px]">
        <p className={`text-overline font-semibold uppercase ${accentClass[accent]}`}>{eyebrow}</p>
        <h1 className="mt-4 font-display text-h1 font-bold text-[color:var(--color-text-primary)]">
          {title}
        </h1>
        <p className="mt-4 text-body-lg text-[color:var(--color-text-muted)]">{description}</p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          {actions.map((action) => {
            const isPrimary = (action.variant ?? 'primary') === 'primary';
            return (
              <Link
                key={action.href + action.label}
                href={action.href}
                className={cn(
                  'inline-flex h-11 w-full items-center justify-center rounded-md px-5 text-body font-medium transition-colors duration-fast ease-out sm:w-auto',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg-page)]',
                  isPrimary
                    ? 'bg-[color:var(--color-brand-primary)] text-white hover:bg-[color:var(--color-brand-hover)]'
                    : 'border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] text-[color:var(--color-text-primary)] hover:border-[color:var(--color-brand-primary)]',
                )}
              >
                {action.label}
              </Link>
            );
          })}
        </div>
      </div>
    </main>
  );
}
