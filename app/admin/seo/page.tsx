import type { Metadata } from 'next';
import { requirePermissionOrRedirect } from '@/lib/auth/guards';
import { getGlobalSeoConfig, listSeoOverrides } from '@/lib/actions/seo-actions';
import { PageHeader } from '@/components/admin/page-primitives';
import { SeoManagerClient } from '@/components/admin/seo-manager-client';

export const metadata: Metadata = { title: 'SEO Manager', robots: { index: false, follow: false } };

export default async function AdminSeoPage(): Promise<React.ReactElement> {
  await requirePermissionOrRedirect('SEO', 'VIEW', '/admin/seo');

  const [globalResult, overridesResult] = await Promise.all([getGlobalSeoConfig(), listSeoOverrides()]);

  return (
    <>
      <PageHeader title="SEO Manager" description="Global defaults and per-page overrides. No code required." />
      <SeoManagerClient
        globalConfig={globalResult.ok ? globalResult.data : null}
        overrides={overridesResult.ok ? overridesResult.data : []}
      />
    </>
  );
}
