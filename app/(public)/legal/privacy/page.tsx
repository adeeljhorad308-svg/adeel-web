import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Privacy Policy' };
export default function PrivacyPage(): React.ReactElement {
  return (
    <main id="main-content" className="mx-auto max-w-[760px] px-5 py-24">
      <h1 className="font-display text-h1 font-bold text-[color:var(--color-text-primary)]">
        Privacy Policy
      </h1>
      <div className="prose mt-8 text-body text-[color:var(--color-text-body)]">
        <p>
          This Privacy Policy explains how Adeel IT Solutions collects, uses, and protects your
          information when you use our website and services. Content is managed by the site
          administrator.
        </p>
      </div>
    </main>
  );
}
