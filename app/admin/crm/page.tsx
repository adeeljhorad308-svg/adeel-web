import type { Metadata } from 'next';
import { requirePermissionOrRedirect } from '@/lib/auth/guards';
import { listLeads } from '@/lib/actions/crm-actions';
import { PageHeader } from '@/components/admin/page-primitives';
import { CrmBoardClient } from '@/components/admin/crm-board-client';

export const metadata: Metadata = { title: 'CRM', robots: { index: false, follow: false } };

export default async function AdminCrmPage(): Promise<React.ReactElement> {
  await requirePermissionOrRedirect('CRM', 'VIEW', '/admin/crm');
  const result = await listLeads({ page: 1, pageSize: 100, order: 'desc' });
  return (
    <>
      <PageHeader title="CRM" description="Track and manage sales leads." />
      <CrmBoardClient initial={result.ok ? [...result.data.items] : []} />
    </>
  );
}
