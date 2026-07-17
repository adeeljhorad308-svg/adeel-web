import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { requirePermissionOrRedirect } from '@/lib/auth/guards';
import { listIndustries } from '@/lib/actions/industries-actions';
import { PageHeader } from '@/components/admin/page-primitives';
import { Button } from '@/components/ui/button';
import { IndustriesListClient } from '@/components/admin/industries-list-client';

export const metadata: Metadata = { title: 'Industries', robots: { index: false, follow: false } };

export default async function AdminIndustriesPage(): Promise<React.ReactElement> {
  await requirePermissionOrRedirect('INDUSTRIES', 'VIEW', '/admin/industries');
  const result = await listIndustries({ page: 1, pageSize: 50, order: 'asc' });
  const industries = result.ok ? result.data.items : [];

  return (
    <>
      <PageHeader
        title="Industries"
        description="Manage the sector-specific pages shown on your site."
        action={
          <Link href="/admin/industries/new">
            <Button><Plus className="h-4 w-4" aria-hidden="true" />Add industry</Button>
          </Link>
        }
      />
      <IndustriesListClient initialIndustries={[...industries]} />
    </>
  );
}
