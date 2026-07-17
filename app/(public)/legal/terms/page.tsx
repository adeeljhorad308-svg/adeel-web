import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Terms of Service' };
export default function TermsPage(): React.ReactElement {
  return (
    <main id="main-content" className="mx-auto max-w-[760px] px-5 py-24">
      <h1 className="font-display text-h1 font-bold text-[color:var(--color-text-primary)]">Terms of Service</h1>
      <div className="prose mt-8 text-body text-[color:var(--color-text-body)]">
        <p>These Terms govern your use of the Adeel IT Solutions website and services. Content is managed by the site administrator.</p>
      </div>
    </main>
  );
}
