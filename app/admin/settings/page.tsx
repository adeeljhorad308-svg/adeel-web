import type { Metadata } from 'next';
import { requirePermissionOrRedirect } from '@/lib/auth/guards';
import {
  getCompanySettings,
  getSocialLinks,
  getAnalyticsSettings,
} from '@/lib/actions/settings-actions';
import { PageHeader } from '@/components/admin/page-primitives';
import { SettingsClient } from '@/components/admin/settings-client';

export const metadata: Metadata = { title: 'Settings', robots: { index: false, follow: false } };

export default async function AdminSettingsPage(): Promise<React.ReactElement> {
  await requirePermissionOrRedirect('SETTINGS', 'VIEW', '/admin/settings');

  const [company, social, analytics] = await Promise.all([
    getCompanySettings(),
    getSocialLinks(),
    getAnalyticsSettings(),
  ]);

  return (
    <>
      <PageHeader
        title="Settings"
        description="Company details, social links, and analytics — all editable, no code required."
      />
      <SettingsClient
        company={company.ok ? company.data : {}}
        social={social.ok ? social.data : {}}
        analytics={analytics.ok ? analytics.data : {}}
      />
    </>
  );
}
