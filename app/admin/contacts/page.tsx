import type { Metadata } from 'next';
import { requirePermissionOrRedirect } from '@/lib/auth/guards';
import { listContactRequests } from '@/lib/actions/contact-actions';
import { PageHeader } from '@/components/admin/page-primitives';
import { ContactsListClient } from '@/components/admin/contacts-list-client';

export const metadata: Metadata = {
  title: 'Contact Requests',
  robots: { index: false, follow: false },
};

export default async function AdminContactsPage(): Promise<React.ReactElement> {
  await requirePermissionOrRedirect('CONTACTS', 'VIEW', '/admin/contacts');
  const result = await listContactRequests({ page: 1, pageSize: 50, order: 'desc' });
  return (
    <>
      <PageHeader
        title="Contact Requests"
        description="Manage submissions from your public contact form."
      />
      <ContactsListClient initial={result.ok ? [...result.data.items] : []} />
    </>
  );
}
