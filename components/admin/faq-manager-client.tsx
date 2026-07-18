'use client';

import { useState, useTransition } from 'react';
import { Plus, Trash2, ArrowUp, ArrowDown } from 'lucide-react';
import { upsertFaq, deleteFaq } from '@/lib/actions/faq-actions';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { EmptyState } from '@/components/admin/page-primitives';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import type { GlobalFaq } from '@prisma/client';

/**
 * FAQ Manager (Stage 2 §10). Inline editing — each FAQ is small enough that a
 * separate create/edit page would add friction without benefit. Reorder is
 * button-driven for full keyboard operability, consistent with Navigation.
 */
export function FaqManagerClient({
  initialFaqs,
}: {
  initialFaqs: GlobalFaq[];
}): React.ReactElement {
  const [faqs, setFaqs] = useState(initialFaqs);
  const [pendingDelete, setPendingDelete] = useState<GlobalFaq | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function updateLocal(id: string, patch: Partial<GlobalFaq>): void {
    setFaqs((prev) => prev.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  }

  function saveFaq(faq: GlobalFaq): void {
    startTransition(async () => {
      const result = await upsertFaq(faq);
      if (!result.ok) setError(result.error.message);
    });
  }

  function addFaq(): void {
    startTransition(async () => {
      const result = await upsertFaq({
        question: '',
        answer: '',
        order: faqs.length,
        visible: true,
      });
      if (result.ok) setFaqs((prev) => [...prev, result.data]);
      else setError(result.error.message);
    });
  }

  function move(index: number, direction: -1 | 1): void {
    const target = index + direction;
    if (target < 0 || target >= faqs.length) return;
    const current = faqs[index];
    const swapTarget = faqs[target];
    if (!current || !swapTarget) return;

    const reordered = [...faqs];
    reordered[index] = swapTarget;
    reordered[target] = current;
    const withOrder = reordered.map((f, i) => ({ ...f, order: i }));
    setFaqs(withOrder);
    startTransition(async () => {
      await Promise.all(withOrder.map((f) => upsertFaq(f)));
    });
  }

  function handleDelete(): void {
    if (!pendingDelete) return;
    startTransition(async () => {
      const result = await deleteFaq(pendingDelete.id);
      if (result.ok) setFaqs((prev) => prev.filter((f) => f.id !== pendingDelete.id));
      setPendingDelete(null);
    });
  }

  if (faqs.length === 0) {
    return (
      <EmptyState
        title="No FAQs yet"
        description="Add frequently asked questions to reduce friction before the contact form."
        action={
          <Button onClick={addFaq}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Add FAQ
          </Button>
        }
      />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <Alert tone="error">{error}</Alert>}
      <ul className="flex flex-col gap-3">
        {faqs.map((faq, index) => (
          <li
            key={faq.id}
            className="rounded-lg border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] p-4"
          >
            <div className="flex items-start gap-3">
              <div className="flex flex-col gap-1 pt-1">
                <button
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label="Move up"
                  className="rounded p-1 text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-bg-subtle)] disabled:opacity-30"
                >
                  <ArrowUp className="h-4 w-4" aria-hidden="true" />
                </button>
                <button
                  onClick={() => move(index, 1)}
                  disabled={index === faqs.length - 1}
                  aria-label="Move down"
                  className="rounded p-1 text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-bg-subtle)] disabled:opacity-30"
                >
                  <ArrowDown className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <input
                  value={faq.question}
                  onChange={(e) => updateLocal(faq.id, { question: e.target.value })}
                  onBlur={(e) => saveFaq({ ...faq, question: e.target.value })}
                  placeholder="Question"
                  className="h-10 rounded-md border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-page)] px-3 text-body font-medium"
                />
                <textarea
                  value={faq.answer}
                  onChange={(e) => updateLocal(faq.id, { answer: e.target.value })}
                  onBlur={(e) => saveFaq({ ...faq, answer: e.target.value })}
                  placeholder="Answer"
                  rows={2}
                  className="rounded-md border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-page)] px-3 py-2 text-small"
                />
                <label className="flex items-center gap-2 text-small text-[color:var(--color-text-muted)]">
                  <input
                    type="checkbox"
                    checked={faq.visible}
                    onChange={(e) => {
                      updateLocal(faq.id, { visible: e.target.checked });
                      saveFaq({ ...faq, visible: e.target.checked });
                    }}
                    className="h-4 w-4 rounded border-[color:var(--color-border-default)]"
                  />
                  Visible
                </label>
              </div>
              <button
                onClick={() => setPendingDelete(faq)}
                aria-label="Delete FAQ"
                className="rounded-md p-2 text-[color:var(--color-feedback-error)] hover:bg-[color:var(--color-bg-subtle)]"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </li>
        ))}
      </ul>
      <Button variant="secondary" onClick={addFaq} loading={isPending} className="w-fit">
        <Plus className="h-4 w-4" aria-hidden="true" />
        Add FAQ
      </Button>

      <ConfirmDialog
        open={pendingDelete !== null}
        title="Delete this FAQ?"
        description="This removes it from the public FAQ section."
        onConfirm={handleDelete}
        onCancel={() => setPendingDelete(null)}
        loading={isPending}
      />
    </div>
  );
}
