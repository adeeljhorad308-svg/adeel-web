import type { Metadata } from 'next';
import { requirePermissionOrRedirect } from '@/lib/auth/guards';
import { listFaqs } from '@/lib/actions/faq-actions';
import { PageHeader } from '@/components/admin/page-primitives';
import { FaqManagerClient } from '@/components/admin/faq-manager-client';

export const metadata: Metadata = { title: 'FAQ', robots: { index: false, follow: false } };

export default async function AdminFaqPage(): Promise<React.ReactElement> {
  await requirePermissionOrRedirect('SETTINGS', 'VIEW', '/admin/faq');
  const result = await listFaqs();

  return (
    <>
      <PageHeader title="FAQ" description="Manage the frequently asked questions shown on your homepage." />
      <FaqManagerClient initialFaqs={result.ok ? result.data : []} />
    </>
  );
}
