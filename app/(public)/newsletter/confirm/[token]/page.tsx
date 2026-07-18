import type { Metadata } from 'next';
import { confirmNewsletterSubscription } from '@/lib/actions/newsletter-actions';
import { Alert } from '@/components/ui/alert';

export const metadata: Metadata = { title: 'Confirm subscription' };

export default async function ConfirmNewsletterPage({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<React.ReactElement> {
  const { token } = await params;
  const result = await confirmNewsletterSubscription(token);
  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-screen max-w-lg flex-col items-center justify-center px-5 text-center"
    >
      <h1 className="font-display text-h2 font-bold text-[color:var(--color-text-primary)]">
        Newsletter
      </h1>
      <div className="mt-4 w-full">
        {result.ok ? (
          <Alert tone="success">You&apos;re subscribed. Thanks for joining!</Alert>
        ) : (
          <Alert tone="error">{result.error.message}</Alert>
        )}
      </div>
    </main>
  );
}
