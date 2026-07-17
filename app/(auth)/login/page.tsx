import type { Metadata } from 'next';
import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getCurrentUser } from '@/lib/auth/guards';
import { LoginForm } from '@/components/public/login-form';

/** Login page (Stage 3 Zone B). Already-authenticated users skip to the dashboard. */
export const metadata: Metadata = {
  title: 'Sign in',
  robots: { index: false, follow: false },
};

export default async function LoginPage(): Promise<React.ReactElement> {
  const user = await getCurrentUser();
  if (user) redirect('/admin');

  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
