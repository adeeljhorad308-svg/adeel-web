/**
 * Admin loading state (Next.js App Router `loading.tsx` convention).
 *
 * Automatically wraps every page under /admin in a Suspense boundary — this
 * renders instantly on navigation while the target page's server data fetch
 * is in flight, instead of a blank screen. Stage 4 requires a loading state
 * for every module; this single file covers all of them consistently.
 */
export default function AdminLoading(): React.ReactElement {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-live="polite">
      <div className="h-8 w-48 animate-pulse rounded-md bg-[color:var(--color-bg-subtle)]" />
      <div className="h-4 w-96 max-w-full animate-pulse rounded-md bg-[color:var(--color-bg-subtle)]" />
      <div className="mt-4 flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-lg border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-subtle)]"
          />
        ))}
      </div>
      <span className="sr-only">Loading…</span>
    </div>
  );
}
