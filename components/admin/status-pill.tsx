import { cn } from '@/lib/utils';

/**
 * StatusPill (Stage 4 §0). Renders DRAFT/PUBLISHED/ARCHIVED and active/inactive
 * consistently across every module. Color is paired with the label text, never
 * color alone (WCAG 2.2 AA).
 */
type Status = 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' | 'ACTIVE' | 'INACTIVE';

const styles: Record<Status, string> = {
  DRAFT: 'bg-[color:var(--color-bg-subtle)] text-[color:var(--color-text-muted)]',
  PUBLISHED:
    'bg-[color:var(--color-feedback-success)]/15 text-[color:var(--color-feedback-success)]',
  ARCHIVED: 'bg-[color:var(--color-bg-subtle)] text-[color:var(--color-text-muted)]',
  ACTIVE: 'bg-[color:var(--color-feedback-success)]/15 text-[color:var(--color-feedback-success)]',
  INACTIVE: 'bg-[color:var(--color-bg-subtle)] text-[color:var(--color-text-muted)]',
};

export function StatusPill({ status }: { status: Status }): React.ReactElement {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-overline font-semibold uppercase',
        styles[status],
      )}
    >
      {status.toLowerCase()}
    </span>
  );
}
