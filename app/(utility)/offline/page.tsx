import type { Metadata } from 'next';
import { UtilityPage } from '@/components/patterns/utility-page';

/** Offline fallback (Stage 3 Batch G). Served by the service worker when offline. */
export const metadata: Metadata = {
  title: "You're offline",
  robots: { index: false, follow: false },
};

export default function OfflinePage(): React.ReactElement {
  return (
    <UtilityPage
      eyebrow="No connection"
      title="You're offline"
      description="Check your connection and try again. Some pages you've already visited may still be available."
      accent="muted"
      actions={[{ label: 'Retry', href: '/', variant: 'primary' }]}
    />
  );
}
