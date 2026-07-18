import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { requirePermissionOrRedirect } from '@/lib/auth/guards';
import { getPost } from '@/lib/actions/blog-actions';
import { PageHeader } from '@/components/admin/page-primitives';
import { PostEditorForm } from '@/components/admin/post-editor-form';

export const metadata: Metadata = {
  title: 'Edit article',
  robots: { index: false, follow: false },
};

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<React.ReactElement> {
  await requirePermissionOrRedirect('BLOG', 'EDIT', '/admin/blog');
  const { id } = await params;
  const result = await getPost(id);
  if (!result.ok || !result.data) notFound();

  return (
    <>
      <PageHeader title={`Edit "${result.data.title}"`} />
      <PostEditorForm post={result.data} />
    </>
  );
}
