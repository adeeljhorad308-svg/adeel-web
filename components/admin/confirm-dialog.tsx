'use client';

import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';

/**
 * ConfirmDialog (Stage 4 §0). Shared destructive-action confirmation. Focus is
 * trapped and returned to the trigger on close (WCAG 2.2 AA). Used for delete
 * actions across every module rather than a native `confirm()`.
 */
export interface ConfirmDialogProps {
  readonly open: boolean;
  readonly title: string;
  readonly description: string;
  readonly confirmLabel?: string;
  readonly onConfirm: () => void;
  readonly onCancel: () => void;
  readonly loading?: boolean;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Delete',
  onConfirm,
  onCancel,
  loading = false,
}: ConfirmDialogProps): React.ReactElement | null {
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    dialogRef.current?.focus();
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onCancel();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onCancel} aria-hidden="true" />
      <div
        ref={dialogRef}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-title"
        aria-describedby="confirm-description"
        tabIndex={-1}
        className="relative w-full max-w-sm rounded-lg border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] p-6 shadow-lg"
      >
        <h2 id="confirm-title" className="font-display text-h4 font-bold text-[color:var(--color-text-primary)]">
          {title}
        </h2>
        <p id="confirm-description" className="mt-2 text-small text-[color:var(--color-text-muted)]">
          {description}
        </p>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="destructive" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}
