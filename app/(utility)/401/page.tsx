import type { Metadata } from 'next';
import { UtilityPage } from '@/components/patterns/utility-page';

export const metadata: Metadata = {
  title: 'Sign in required',
  robots: { index: false, follow: false },
};

/** 401 — authentication required (Stage 3 Batch G). */
export default function UnauthorizedPage(): React.ReactElement {
  return (
    <UtilityPage
      eyebrow="Error 401"
      title="You need to sign in"
      description="This area requires an account. Sign in to continue."
      actions={[
        { label: 'Sign in', href: '/login', variant: 'primary' },
        { label: 'Go home', href: '/', variant: 'secondary' },
      ]}
    />
  );
}
