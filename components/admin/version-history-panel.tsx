'use client';

import { useEffect, useState } from 'react';
import { History } from 'lucide-react';
import { listVersionHistory } from '@/lib/actions/version-history-actions';
import type { VersionListItem } from '@/lib/services/version-history-service';
import { ClientFormattedDate } from '@/components/ui/client-formatted-date';
import type { VersionedEntity } from '@prisma/client';

/**
 * Version history panel (Stage 5 improvement: visual change history). Shared
 * across every versioned module's editor. Lazily loads on expand so it never
 * costs a query on pages where the editor is just opened to make a fresh edit.
 */
export function VersionHistoryPanel({
  entity,
  entityId,
}: {
  entity: VersionedEntity;
  entityId: string;
}): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<readonly VersionListItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!open || loaded) return;
    setLoading(true);
    void listVersionHistory(entity, entityId)
      .then((result) => {
        if (result.ok) setItems(result.data);
        setLoaded(true);
      })
      .catch(() => {
        setLoaded(true);
      })
      .finally(() => setLoading(false));
  }, [open, loaded, entity, entityId]);

  return (
    <div className="rounded-lg border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center gap-2 px-4 py-3 text-left text-small font-semibold text-[color:var(--color-text-primary)]"
      >
        <History className="h-4 w-4" aria-hidden="true" />
        Version history
      </button>
      {open && (
        <div className="border-t border-[color:var(--color-border-default)] p-4">
          {loading && <p className="text-small text-[color:var(--color-text-muted)]">Loading…</p>}
          {!loading && items.length === 0 && (
            <p className="text-small text-[color:var(--color-text-muted)]">
              No previous versions yet.
            </p>
          )}
          <ol className="flex flex-col gap-4">
            {items.map((item) => (
              <li
                key={item.versionNo}
                className="border-l-2 border-[color:var(--color-border-default)] pl-3"
              >
                <p className="text-small font-semibold text-[color:var(--color-text-primary)]">
                  Version {item.versionNo}
                  <span className="ml-2 font-normal text-[color:var(--color-text-muted)]">
                    <ClientFormattedDate date={item.createdAt} />
                  </span>
                </p>
                {item.diff.length === 0 ? (
                  <p className="mt-1 text-small text-[color:var(--color-text-muted)]">
                    Initial version
                  </p>
                ) : (
                  <ul className="mt-1 flex flex-col gap-1">
                    {item.diff.map((d) => (
                      <li key={d.field} className="text-small text-[color:var(--color-text-body)]">
                        <span className="font-medium">{d.field}</span> changed
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
