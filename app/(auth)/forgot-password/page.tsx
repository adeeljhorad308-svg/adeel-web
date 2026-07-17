import type { Metadata } from 'next';
import { ForgotPasswordForm } from '@/components/public/password-forms';

export const metadata: Metadata = {
  title: 'Forgot password',
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage(): React.ReactElement {
  return <ForgotPasswordForm />;
}
