'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { globalSearch, type SearchResult } from '@/lib/actions/search-actions';

/** Global search (⌘K) command palette (Stage 4 §20). */
export function GlobalSearch(): React.ReactElement {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent): void {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((v) => !v);
      }
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 50);
  }, [open]);

  useEffect(() => {
    const handle = setTimeout(() => {
      if (query.trim().length >= 2) {
        void globalSearch(query).then((r) => {
          if (r.ok) setResults(r.data);
        });
      } else {
        setResults([]);
      }
    }, 250);
    return () => clearTimeout(handle);
  }, [query]);

  function go(href: string): void {
    setOpen(false);
    setQuery('');
    router.push(href);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex h-9 items-center gap-2 rounded-md border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] px-3 text-small text-[color:var(--color-text-muted)] hover:border-[color:var(--color-brand-primary)]"
      >
        <Search className="h-4 w-4" aria-hidden="true" />
        Search
        <kbd className="ml-4 rounded border border-[color:var(--color-border-default)] px-1 text-overline">
          ⌘K
        </kbd>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-modal flex items-start justify-center pt-24"
      role="dialog"
      aria-modal="true"
      aria-label="Global search"
    >
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />
      <div className="relative w-full max-w-xl rounded-lg border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] shadow-lg">
        <div className="flex items-center gap-2 border-b border-[color:var(--color-border-default)] p-3">
          <Search className="h-4 w-4 text-[color:var(--color-text-muted)]" aria-hidden="true" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search projects, services, blog, leads, media…"
            className="flex-1 bg-transparent text-body outline-none"
          />
          <button onClick={() => setOpen(false)} aria-label="Close search">
            <X className="h-4 w-4 text-[color:var(--color-text-muted)]" aria-hidden="true" />
          </button>
        </div>
        <div className="max-h-96 overflow-y-auto">
          {results.length === 0 && query.trim().length >= 2 && (
            <p className="p-4 text-small text-[color:var(--color-text-muted)]">No matches.</p>
          )}
          {results.map((r) => (
            <button
              key={`${r.type}-${r.id}`}
              onClick={() => go(r.href)}
              className="flex w-full items-center justify-between border-b border-[color:var(--color-border-default)] p-3 text-left last:border-0 hover:bg-[color:var(--color-bg-subtle)]"
            >
              <span className="text-small font-medium text-[color:var(--color-text-primary)]">
                {r.title}
              </span>
              <span className="text-overline uppercase text-[color:var(--color-text-muted)]">
                {r.type}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
