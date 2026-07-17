import type { Metadata } from 'next';
import { requirePermissionOrRedirect } from '@/lib/auth/guards';
import { getFooterConfig } from '@/lib/actions/footer-actions';
import { PageHeader } from '@/components/admin/page-primitives';
import { FooterBuilderClient } from '@/components/admin/footer-builder-client';
import type { FooterConfigInput } from '@/lib/validation/footer';

export const metadata: Metadata = { title: 'Footer', robots: { index: false, follow: false } };

export default async function AdminFooterPage(): Promise<React.ReactElement> {
  await requirePermissionOrRedirect('FOOTER', 'VIEW', '/admin/footer');

  const result = await getFooterConfig();
  const initial: FooterConfigInput = result.ok && result.data
    ? {
        columns: result.data.columns as FooterConfigInput['columns'],
        copyright: result.data.copyright ?? undefined,
        showNewsletter: result.data.showNewsletter,
      }
    : { columns: [], showNewsletter: true };

  return (
    <>
      <PageHeader title="Footer" description="Manage footer link columns, copyright, and newsletter visibility." />
      <FooterBuilderClient initial={initial} />
    </>
  );
}
