/**
 * Auth route-group loading state (Stage 3 Zone B). Matches the auth layout's
 * card shape so the transition from skeleton to real content doesn't jump.
 */
export default function AuthLoading(): React.ReactElement {
  return (
    <div className="flex flex-col gap-4" aria-busy="true" aria-live="polite">
      <div className="h-6 w-40 animate-pulse rounded-md bg-[color:var(--color-bg-subtle)]" />
      <div className="h-4 w-full animate-pulse rounded-md bg-[color:var(--color-bg-subtle)]" />
      <div className="mt-2 h-11 w-full animate-pulse rounded-md bg-[color:var(--color-bg-subtle)]" />
      <div className="h-11 w-full animate-pulse rounded-md bg-[color:var(--color-bg-subtle)]" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
