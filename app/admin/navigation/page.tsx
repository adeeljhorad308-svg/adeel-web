import type { Metadata } from 'next';
import { requirePermissionOrRedirect } from '@/lib/auth/guards';
import { getNavigationMenu } from '@/lib/actions/navigation-actions';
import { PageHeader } from '@/components/admin/page-primitives';
import { NavigationBuilderClient } from '@/components/admin/navigation-builder-client';

export const metadata: Metadata = { title: 'Navigation', robots: { index: false, follow: false } };

export default async function AdminNavigationPage(): Promise<React.ReactElement> {
  await requirePermissionOrRedirect('NAVIGATION', 'VIEW', '/admin/navigation');

  const result = await getNavigationMenu('HEADER', 'primary');

  return (
    <>
      <PageHeader
        title="Navigation"
        description="Manage the header menu shown across the public site."
      />
      <NavigationBuilderClient context="HEADER" menu={result.ok ? result.data : null} />
    </>
  );
}
