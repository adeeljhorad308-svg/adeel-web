import type { Metadata } from 'next';
import { requirePermissionOrRedirect } from '@/lib/auth/guards';
import { PageHeader } from '@/components/admin/page-primitives';
import { PostEditorForm } from '@/components/admin/post-editor-form';

export const metadata: Metadata = {
  title: 'Write article',
  robots: { index: false, follow: false },
};

export default async function NewPostPage(): Promise<React.ReactElement> {
  await requirePermissionOrRedirect('BLOG', 'CREATE', '/admin/blog/new');
  return (
    <>
      <PageHeader title="Write article" />
      <PostEditorForm />
    </>
  );
}
