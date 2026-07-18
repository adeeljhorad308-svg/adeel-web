import type { Metadata } from 'next';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { requirePermissionOrRedirect } from '@/lib/auth/guards';
import { listPosts } from '@/lib/actions/blog-actions';
import { PageHeader } from '@/components/admin/page-primitives';
import { Button } from '@/components/ui/button';
import { BlogListClient } from '@/components/admin/blog-list-client';

export const metadata: Metadata = { title: 'Blog', robots: { index: false, follow: false } };

export default async function AdminBlogPage(): Promise<React.ReactElement> {
  await requirePermissionOrRedirect('BLOG', 'VIEW', '/admin/blog');
  const result = await listPosts({ page: 1, pageSize: 50, order: 'desc' });
  const posts = result.ok ? result.data.items : [];

  return (
    <>
      <PageHeader
        title="Blog"
        description="Write and manage articles for your site."
        action={
          <Link href="/admin/blog/new">
            <Button>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Write article
            </Button>
          </Link>
        }
      />
      <BlogListClient initialPosts={[...posts]} />
    </>
  );
}
