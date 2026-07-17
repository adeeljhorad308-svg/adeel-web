'use client';

import { cn } from '@/lib/utils';

/**
 * DataTable pattern (Stage 4 §0 canonical resource pattern). One implementation
 * shared by every content module's list view. Desktop renders a real <table> with
 * proper semantics; below `lg` it renders the same rows as stacked cards (Stage 4
 * §1: "tables never horizontally scroll into oblivion").
 */

export interface DataTableColumn<T> {
  readonly key: string;
  readonly header: string;
  readonly render: (row: T) => React.ReactNode;
  /** Hide this column on the mobile card view (e.g. a thumbnail already shown). */
  readonly hideOnMobile?: boolean;
}

export interface DataTableProps<T> {
  readonly columns: readonly DataTableColumn<T>[];
  readonly rows: readonly T[];
  readonly getRowId: (row: T) => string;
  readonly rowActions?: (row: T) => React.ReactNode;
  readonly caption: string;
}

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  rowActions,
  caption,
}: DataTableProps<T>): React.ReactElement {
  return (
    <>
      {/* Desktop / tablet: real table. */}
      <div className="hidden overflow-x-auto rounded-lg border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] lg:block">
        <table className="w-full text-left text-small">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-[color:var(--color-border-default)]">
              {columns.map((col) => (
                <th key={col.key} scope="col" className="px-4 py-3 font-semibold text-[color:var(--color-text-muted)]">
                  {col.header}
                </th>
              ))}
              {rowActions && <th scope="col" className="px-4 py-3" />}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={getRowId(row)} className="border-b border-[color:var(--color-border-default)] last:border-0">
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-[color:var(--color-text-body)]">
                    {col.render(row)}
                  </td>
                ))}
                {rowActions && <td className="px-4 py-3 text-right">{rowActions(row)}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile: stacked cards, one per row. */}
      <ul className="flex flex-col gap-3 lg:hidden">
        {rows.map((row) => (
          <li
            key={getRowId(row)}
            className="rounded-lg border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] p-4"
          >
            <dl className="flex flex-col gap-2">
              {columns
                .filter((col) => !col.hideOnMobile)
                .map((col) => (
                  <div key={col.key} className={cn('flex items-center justify-between gap-3')}>
                    <dt className="text-overline font-semibold uppercase text-[color:var(--color-text-muted)]">
                      {col.header}
                    </dt>
                    <dd className="text-right text-[color:var(--color-text-body)]">{col.render(row)}</dd>
                  </div>
                ))}
            </dl>
            {rowActions && <div className="mt-3 flex justify-end gap-2">{rowActions(row)}</div>}
          </li>
        ))}
      </ul>
    </>
  );
}
