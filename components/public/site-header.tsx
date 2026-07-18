import Link from 'next/link';
import { APP_NAME } from '@/lib/constants';

/** Public site header (Stage 2 nav). Minimal, functional nav across all public pages. */
export function SiteHeader(): React.ReactElement {
  return (
    <header className="bg-[color:var(--color-bg-surface)]/95 sticky top-0 z-sticky border-b border-[color:var(--color-border-default)] backdrop-blur">
      <div className="mx-auto flex h-16 max-w-content-xl items-center justify-between px-5 lg:px-8">
        <Link
          href="/"
          className="font-display text-h4 font-bold text-[color:var(--color-text-primary)]"
        >
          {APP_NAME.split(' ')[0]}
          <span className="text-[color:var(--color-brand-primary)]">.</span>
        </Link>
        <nav className="hidden items-center gap-6 text-small font-medium text-[color:var(--color-text-body)] lg:flex">
          <Link href="/services" className="hover:text-[color:var(--color-brand-primary)]">
            Services
          </Link>
          <Link href="/industries" className="hover:text-[color:var(--color-brand-primary)]">
            Industries
          </Link>
          <Link href="/work" className="hover:text-[color:var(--color-brand-primary)]">
            Work
          </Link>
          <Link href="/about" className="hover:text-[color:var(--color-brand-primary)]">
            About
          </Link>
          <Link href="/blog" className="hover:text-[color:var(--color-brand-primary)]">
            Blog
          </Link>
        </nav>
        <Link
          href="/contact"
          className="rounded-md bg-[color:var(--color-brand-primary)] px-4 py-2 text-small font-medium text-white hover:bg-[color:var(--color-brand-hover)]"
        >
          Contact
        </Link>
      </div>
    </header>
  );
}
