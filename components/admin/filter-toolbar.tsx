'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/form-field';

/**
 * FilterToolbar pattern (Stage 4 §0). Shared search + select-filter bar used by
 * every module's list page. Debounces the search input and syncs filters into
 * the URL (`?search=&status=`) so filtered views are shareable/bookmarkable and
 * survive a refresh, per the Stage 3 pagination/filter contract applied to admin.
 */

export interface FilterSelect {
  readonly param: string;
  readonly label: string;
  readonly options: ReadonlyArray<{ value: string; label: string }>;
}

export interface FilterToolbarProps {
  readonly searchPlaceholder?: string;
  readonly selects?: readonly FilterSelect[];
}

export function FilterToolbar({
  searchPlaceholder = 'Search…',
  selects = [],
}: FilterToolbarProps): React.ReactElement {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [searchValue, setSearchValue] = useState(searchParams.get('search') ?? '');
  const [, startTransition] = useTransition();

  const applyParam = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) params.set(key, value);
      else params.delete(key);
      params.set('page', '1');
      startTransition(() => {
        router.push(`${pathname}?${params.toString()}`);
      });
    },
    [pathname, router, searchParams],
  );

  useEffect(() => {
    const handle = setTimeout(() => {
      if (searchValue !== (searchParams.get('search') ?? '')) {
        applyParam('search', searchValue);
      }
    }, 300);
    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchValue]);

  return (
    <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="relative flex-1 sm:max-w-xs">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[color:var(--color-text-muted)]"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          placeholder={searchPlaceholder}
          aria-label="Search"
          className="pl-9"
        />
      </div>
      {selects.map((select) => (
        <select
          key={select.param}
          aria-label={select.label}
          defaultValue={searchParams.get(select.param) ?? ''}
          onChange={(e) => applyParam(select.param, e.target.value)}
          className="h-11 rounded-md border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] px-3 text-body text-[color:var(--color-text-primary)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-brand-primary)]"
        >
          <option value="">{select.label}: All</option>
          {select.options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ))}
    </div>
  );
}
