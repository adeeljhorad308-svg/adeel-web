import type { Metadata } from 'next';
import { UtilityPage } from '@/components/patterns/utility-page';

/** Maintenance page (Stage 3 Batch G). Served via middleware rewrite with a 503. */
export const metadata: Metadata = {
  title: "We'll be right back",
  robots: { index: false, follow: false },
};

export default function MaintenancePage(): React.ReactElement {
  return (
    <UtilityPage
      eyebrow="Scheduled maintenance"
      title="We'll be right back"
      description="We're making improvements and will be back shortly. Thanks for your patience."
      accent="warning"
      actions={[{ label: 'Contact us', href: '/contact', variant: 'secondary' }]}
    />
  );
}
