'use client';

import { useEffect } from 'react';

/**
 * Route-segment error boundary → renders the 500 variant. Dependency-free so it
 * displays even during real failures. The error is reported to monitoring; no
 * stack trace is shown to the user (Stage 5 §22; OWASP: sensitive data exposure).
 */
export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  useEffect(() => {
    // Client-side report hook; server errors are logged server-side already.
    // console.error is allowed by the no-console rule (see eslint.config.mjs).
    console.error('Unhandled error boundary:', error.digest ?? error.message);
  }, [error]);

  return (
    <main
      id="main-content"
      className="flex min-h-screen flex-col items-center justify-center bg-[color:var(--color-bg-page)] px-5 text-center"
    >
      <div className="w-full max-w-[560px]">
        <p className="text-overline font-semibold uppercase text-[color:var(--color-feedback-error)]">
          Error 500
        </p>
        <h1 className="mt-4 font-display text-h1 font-bold text-[color:var(--color-text-primary)]">
          Something went wrong on our end
        </h1>
        <p className="mt-4 text-body-lg text-[color:var(--color-text-muted)]">
          We hit an unexpected problem. Try again, and if it keeps happening, contact us.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <button
            onClick={reset}
            className="inline-flex h-11 w-full items-center justify-center rounded-md bg-[color:var(--color-brand-primary)] px-5 text-body font-medium text-white transition-colors duration-fast ease-out hover:bg-[color:var(--color-brand-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-brand-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[color:var(--color-bg-page)] sm:w-auto"
          >
            Try again
          </button>
          <a
            href="/contact"
            className="inline-flex h-11 w-full items-center justify-center rounded-md border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] px-5 text-body font-medium text-[color:var(--color-text-primary)] transition-colors duration-fast ease-out hover:border-[color:var(--color-brand-primary)] sm:w-auto"
          >
            Contact us
          </a>
        </div>
      </div>
    </main>
  );
}
