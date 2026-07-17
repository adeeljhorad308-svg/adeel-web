import type { Metadata } from 'next';
import { requirePermissionOrRedirect } from '@/lib/auth/guards';
import { listMedia } from '@/lib/actions/media-actions';
import { PageHeader } from '@/components/admin/page-primitives';
import { MediaManagerClient } from '@/components/admin/media-manager-client';

export const metadata: Metadata = { title: 'Media Library', robots: { index: false, follow: false } };

/**
 * Media Manager list page (Stage 4 §10). Server-fetches the first page of assets;
 * the client component handles upload, alt-text edit, and delete interactively.
 */
export default async function AdminMediaPage(): Promise<React.ReactElement> {
  await requirePermissionOrRedirect('MEDIA', 'VIEW', '/admin/media');

  const result = await listMedia({ page: 1, pageSize: 48, order: 'desc' });
  const media = result.ok ? result.data.items : [];

  return (
    <>
      <PageHeader title="Media Library" description="Upload and manage images, videos, and documents." />
      <MediaManagerClient initialMedia={[...media]} />
    </>
  );
}
