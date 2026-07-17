import type { Metadata } from 'next';
import { UtilityPage } from '@/components/patterns/utility-page';

/** 404 page (Stage 3 Batch G). Next renders this with a 404 status automatically. */
export const metadata: Metadata = {
  title: 'Page not found',
  robots: { index: false, follow: false },
};

export default function NotFound(): React.ReactElement {
  return (
    <UtilityPage
      eyebrow="Error 404"
      title="This page doesn't exist"
      description="The page you're looking for may have moved or never existed. Let's get you back on track."
      actions={[
        { label: 'Go home', href: '/', variant: 'primary' },
        { label: 'View our work', href: '/work', variant: 'secondary' },
      ]}
    />
  );
}
