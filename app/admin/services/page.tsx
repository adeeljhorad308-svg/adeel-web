import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { requirePermissionOrRedirect } from '@/lib/auth/guards';
import { listServices } from '@/lib/actions/services-actions';
import { PageHeader } from '@/components/admin/page-primitives';
import { Button } from '@/components/ui/button';
import { ServicesListClient } from '@/components/admin/services-list-client';

export const metadata: Metadata = { title: 'Services', robots: { index: false, follow: false } };

/**
 * Services Manager list page (Stage 4 §4). Server-fetches the first page and
 * hands off to the client component for interactive delete/reorder. Enforces
 * VIEW permission before rendering — the page itself redirects to /403 for a
 * viewer without access, and to /login if unauthenticated (Stage 5 §7–§8).
 */
export default async function AdminServicesPage(): Promise<React.ReactElement> {
  await requirePermissionOrRedirect('SERVICES', 'VIEW', '/admin/services');

  const result = await listServices({ page: 1, pageSize: 50, order: 'asc' });
  const services = result.ok ? result.data.items : [];

  return (
    <>
      <PageHeader
        title="Services"
        description="Manage the services shown on your site and used in quotes."
        action={
          <Link href="/admin/services/new">
            <Button>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add service
            </Button>
          </Link>
        }
      />
      <ServicesListClient initialServices={[...services]} />
    </>
  );
}
