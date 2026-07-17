import type { Metadata } from 'next';
import { UtilityPage } from '@/components/patterns/utility-page';

export const metadata: Metadata = {
  title: 'Access denied',
  robots: { index: false, follow: false },
};

/** 403 — authenticated but not permitted (Stage 3 Batch G). No sensitive detail. */
export default function ForbiddenPage(): React.ReactElement {
  return (
    <UtilityPage
      eyebrow="Error 403"
      title="You don't have access"
      description="Your account doesn't have permission to view this page. If you think this is a mistake, contact an administrator."
      actions={[
        { label: 'Back to dashboard', href: '/admin', variant: 'primary' },
        { label: 'Go home', href: '/', variant: 'secondary' },
      ]}
    />
  );
}
