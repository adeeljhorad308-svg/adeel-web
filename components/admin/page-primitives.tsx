import { cn } from '@/lib/utils';

/**
 * Admin page primitives (Stage 4 §1). PageHeader gives every module a consistent
 * title + optional action row. EmptyState turns a blank screen into an invitation
 * to act (frontend-design guidance) rather than a dead end, and never fabricates
 * data to fill space.
 */

export function PageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h1 className="font-display text-h2 font-bold text-[color:var(--color-text-primary)]">
          {title}
        </h1>
        {description && (
          <p className="mt-1 text-body text-[color:var(--color-text-muted)]">{description}</p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function EmptyState({
  title,
  description,
  action,
  className,
}: {
  title: string;
  description: string;
  action?: React.ReactNode;
  className?: string;
}): React.ReactElement {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center rounded-lg border border-dashed border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] px-6 py-16 text-center',
        className,
      )}
    >
      <h2 className="font-display text-h4 font-semibold text-[color:var(--color-text-primary)]">
        {title}
      </h2>
      <p className="mt-2 max-w-md text-small text-[color:var(--color-text-muted)]">{description}</p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}

export function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}): React.ReactElement {
  return (
    <div className="rounded-lg border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] p-5 shadow-sm">
      <p className="text-small font-medium text-[color:var(--color-text-muted)]">{label}</p>
      <p className="mt-2 font-display text-h2 font-bold text-[color:var(--color-text-primary)]">
        {value}
      </p>
      {hint && <p className="mt-1 text-small text-[color:var(--color-text-muted)]">{hint}</p>}
    </div>
  );
}
