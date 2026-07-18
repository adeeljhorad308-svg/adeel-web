import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { requirePermissionOrRedirect } from '@/lib/auth/guards';
import { listProjects } from '@/lib/actions/portfolio-actions';
import { PageHeader } from '@/components/admin/page-primitives';
import { Button } from '@/components/ui/button';
import { PortfolioListClient } from '@/components/admin/portfolio-list-client';

export const metadata: Metadata = { title: 'Portfolio', robots: { index: false, follow: false } };

export default async function AdminPortfolioPage(): Promise<React.ReactElement> {
  await requirePermissionOrRedirect('PORTFOLIO', 'VIEW', '/admin/portfolio');
  const result = await listProjects({ page: 1, pageSize: 50, order: 'asc' });
  const projects = result.ok ? result.data.items : [];

  return (
    <>
      <PageHeader
        title="Portfolio"
        description="Manage case studies and projects shown on your site."
        action={
          <Link href="/admin/portfolio/new">
            <Button>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add project
            </Button>
          </Link>
        }
      />
      <PortfolioListClient initialProjects={[...projects]} />
    </>
  );
}
