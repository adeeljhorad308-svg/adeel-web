import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';

/** Public site footer (Stage 2 §12). */
export function SiteFooter(): React.ReactElement {
  return (
    <footer className="border-t border-[color:var(--color-border-default)] bg-[color:var(--color-bg-subtle)] py-12">
      <div className="mx-auto flex max-w-content-xl flex-col gap-6 px-5 sm:flex-row sm:items-center sm:justify-between lg:px-8">
        <p className="text-small text-[color:var(--color-text-muted)]">
          © {new Date().getFullYear()} {APP_NAME}. All rights reserved.
        </p>
        <div className="flex gap-6 text-small text-[color:var(--color-text-muted)]">
          <Link href="/legal/privacy" className="hover:text-[color:var(--color-brand-primary)]">
            Privacy
          </Link>
          <Link href="/legal/terms" className="hover:text-[color:var(--color-brand-primary)]">
            Terms
          </Link>
          <Link href="/legal/cookies" className="hover:text-[color:var(--color-brand-primary)]">
            Cookies
          </Link>
        </div>
      </div>
    </footer>
  );
}
