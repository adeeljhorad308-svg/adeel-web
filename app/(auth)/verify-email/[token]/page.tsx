import type { Metadata } from 'next';
import Link from 'next/link';
import { verifyEmailToken } from '@/lib/services/auth-actions';
import { Alert } from '@/components/ui/alert';

export const metadata: Metadata = {
  title: 'Verify email',
  robots: { index: false, follow: false },
};

/** Email verification lands here from the emailed link and consumes the token. */
export default async function VerifyEmailPage({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<React.ReactElement> {
  const { token } = await params;
  const result = await verifyEmailToken(token);

  return (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-h3 font-bold text-[color:var(--color-text-primary)]">
        Email verification
      </h1>
      {result.ok ? (
        <Alert tone="success">Your email is verified. You can now sign in.</Alert>
      ) : (
        <Alert tone="error">{result.error.message}</Alert>
      )}
      <Link href="/login" className="text-small text-[color:var(--color-brand-primary)] hover:underline">
        Continue to sign in
      </Link>
    </div>
  );
}
