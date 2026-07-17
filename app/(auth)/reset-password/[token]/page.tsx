import type { Metadata } from 'next';
import { ResetPasswordForm } from '@/components/public/password-forms';

export const metadata: Metadata = {
  title: 'Reset password',
  robots: { index: false, follow: false },
};

/** Reset page. The token comes from the emailed link; it is validated server-side
 *  on submit (consumed atomically), so an invalid token fails at submission. */
export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<React.ReactElement> {
  const { token } = await params;
  return <ResetPasswordForm token={token} />;
}
