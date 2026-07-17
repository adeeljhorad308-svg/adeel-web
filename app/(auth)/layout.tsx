import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';

/**
 * Auth route-group layout (Stage 3 Zone B). A calm, centered, single-column frame
 * that hosts the login and password-recovery forms. Deliberately minimal — no
 * public nav — to keep focus on the single task.
 */
export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[color:var(--color-bg-page)] px-5 py-12">
      <div className="w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="text-overline font-semibold uppercase tracking-wide text-[color:var(--color-brand-primary)]"
          >
            {APP_NAME}
          </Link>
        </div>
        <main id="main-content" className="rounded-lg border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] p-8 shadow-sm">
          {children}
        </main>
      </div>
    </div>
  );
}
