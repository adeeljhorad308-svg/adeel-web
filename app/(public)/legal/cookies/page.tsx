import type { Metadata } from 'next';
export const metadata: Metadata = { title: 'Cookie Policy' };
export default function CookiesPage(): React.ReactElement {
  return (
    <main id="main-content" className="mx-auto max-w-[760px] px-5 py-24">
      <h1 className="font-display text-h1 font-bold text-[color:var(--color-text-primary)]">
        Cookie Policy
      </h1>
      <div className="prose mt-8 text-body text-[color:var(--color-text-body)]">
        <p>
          We use essential cookies for core site functionality, and — only with your consent —
          analytics cookies to understand site usage. You can change your preference at any time by
          clearing your browser&apos;s local storage for this site.
        </p>
        <table className="mt-6 w-full border-collapse text-small">
          <thead>
            <tr className="border-b">
              <th className="py-2 text-left">Name</th>
              <th className="py-2 text-left">Purpose</th>
              <th className="py-2 text-left">Type</th>
            </tr>
          </thead>
          <tbody>
            <tr className="border-b">
              <td className="py-2">authjs.session-token</td>
              <td className="py-2">Keeps you signed in</td>
              <td className="py-2">Essential</td>
            </tr>
            <tr className="border-b">
              <td className="py-2">cookie-consent</td>
              <td className="py-2">Remembers your cookie choice</td>
              <td className="py-2">Essential</td>
            </tr>
            <tr>
              <td className="py-2">_ga / _gid</td>
              <td className="py-2">Google Analytics (only with consent)</td>
              <td className="py-2">Analytics</td>
            </tr>
          </tbody>
        </table>
      </div>
    </main>
  );
}
