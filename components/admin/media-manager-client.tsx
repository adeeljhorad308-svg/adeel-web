'use client';

import { useCallback, useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import { z } from 'zod';
import { Upload, Trash2, FileText, Film } from 'lucide-react';
import { finalizeUpload, deleteMedia, updateMedia } from '@/lib/actions/media-actions';
import { EmptyState } from '@/components/admin/page-primitives';
import { ConfirmDialog } from '@/components/admin/confirm-dialog';
import { Button } from '@/components/ui/button';
import { Alert } from '@/components/ui/alert';
import type { Media } from '@prisma/client';

/**
 * Media Manager (Stage 4 §10).
 *
 * Upload flow (build-readiness fix): the file is sent to our own
 * `/api/v1/media/upload` Route Handler, which validates the actual file bytes
 * (magic-number sniffing, executable rejection, SVG sanitization) and uploads
 * to Cloudinary server-side — the browser never talks to Cloudinary directly,
 * so there is no path where an unvalidated file reaches storage. The route's
 * response (already-verified metadata) is then persisted via `finalizeUpload`.
 *
 * Delete first checks usage; if referenced elsewhere, the confirm dialog
 * surfaces exactly where before the admin can proceed — never a silent broken
 * reference.
 */
const uploadResponseSchema = z.union([
  z.object({
    ok: z.literal(true),
    data: z.object({
      url: z.string(),
      publicId: z.string(),
      mimeType: z.string(),
      sizeBytes: z.number(),
      width: z.number().optional(),
      height: z.number().optional(),
    }),
  }),
  z.object({
    ok: z.literal(false),
    error: z.object({ message: z.string() }),
  }),
]);

export function MediaManagerClient({ initialMedia }: { initialMedia: Media[] }): React.ReactElement {
  const [media, setMedia] = useState(initialMedia);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<Media | null>(null);
  const [usageWarning, setUsageWarning] = useState<string[] | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError(null);

    for (const file of Array.from(files)) {
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'adeel-it');

        const uploadRes = await fetch('/api/v1/media/upload', {
          method: 'POST',
          body: formData,
        });
        const uploadJson: unknown = await uploadRes.json();
        const parsedUpload = uploadResponseSchema.safeParse(uploadJson);
        if (!parsedUpload.success) {
          setUploadError('Upload failed. Unexpected response from the server.');
          continue;
        }
        const uploadBody = parsedUpload.data;

        if (!uploadBody.ok) {
          setUploadError(uploadBody.error.message);
          continue;
        }

        const finalized = await finalizeUpload({
          publicId: uploadBody.data.publicId,
          url: uploadBody.data.url,
          mimeType: uploadBody.data.mimeType,
          sizeBytes: uploadBody.data.sizeBytes,
          width: uploadBody.data.width,
          height: uploadBody.data.height,
        });

        if (finalized.ok) {
          setMedia((prev) => [finalized.data, ...prev]);
        } else {
          setUploadError(finalized.error.message);
        }
      } catch {
        setUploadError('Upload failed. Check your connection and try again.');
      }
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  function requestDelete(item: Media): void {
    setPendingDelete(item);
    setUsageWarning(null);
  }

  function handleDeleteConfirm(): void {
    if (!pendingDelete) return;
    startTransition(async () => {
      const result = await deleteMedia(pendingDelete.id, usageWarning !== null);
      if (result.ok && 'inUse' in result.data) {
        setUsageWarning(result.data.inUse);
        return;
      }
      if (result.ok) {
        setMedia((prev) => prev.filter((m) => m.id !== pendingDelete.id));
      }
      setPendingDelete(null);
      setUsageWarning(null);
    });
  }

  async function handleAltTextBlur(id: string, altText: string): Promise<void> {
    await updateMedia({ id, altText });
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <Button onClick={() => fileInputRef.current?.click()} loading={uploading}>
          <Upload className="h-4 w-4" aria-hidden="true" />
          Upload files
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,video/*,application/pdf"
          className="sr-only"
          onChange={(e) => void handleFiles(e.target.files)}
        />
      </div>

      {uploadError && <Alert tone="error">{uploadError}</Alert>}

      {media.length === 0 ? (
        <EmptyState title="No media yet" description="Upload your first image, video, or document to get started." />
      ) : (
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {media.map((item) => (
            <li
              key={item.id}
              className="flex flex-col overflow-hidden rounded-lg border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)]"
            >
              <div className="relative flex aspect-square items-center justify-center bg-[color:var(--color-bg-subtle)]">
                {item.type === 'IMAGE' || item.type === 'SVG' ? (
                  <Image src={item.url} alt={item.altText ?? ''} fill sizes="200px" className="object-cover" />
                ) : item.type === 'VIDEO' ? (
                  <Film className="h-8 w-8 text-[color:var(--color-text-muted)]" aria-hidden="true" />
                ) : (
                  <FileText className="h-8 w-8 text-[color:var(--color-text-muted)]" aria-hidden="true" />
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2 p-3">
                <label htmlFor={`alt-${item.id}`} className="text-overline font-semibold uppercase text-[color:var(--color-text-muted)]">
                  Alt text
                </label>
                <input
                  id={`alt-${item.id}`}
                  defaultValue={item.altText ?? ''}
                  onBlur={(e) => void handleAltTextBlur(item.id, e.target.value)}
                  className="h-9 rounded-md border border-[color:var(--color-border-default)] bg-[color:var(--color-bg-page)] px-2 text-small"
                  placeholder="Describe this image"
                />
                <button
                  onClick={() => requestDelete(item)}
                  className="mt-auto flex items-center justify-center gap-1 rounded-md py-1.5 text-small text-[color:var(--color-feedback-error)] hover:bg-[color:var(--color-bg-subtle)]"
                >
                  <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}

      <ConfirmDialog
        open={pendingDelete !== null}
        title={usageWarning ? 'This file is in use' : 'Delete this file?'}
        description={
          usageWarning
            ? `This asset is used in: ${usageWarning.join(', ')}. Deleting it will leave those references broken. Delete anyway?`
            : 'This permanently removes the file from your media library.'
        }
        confirmLabel={usageWarning ? 'Delete anyway' : 'Delete'}
        onConfirm={handleDeleteConfirm}
        onCancel={() => {
          setPendingDelete(null);
          setUsageWarning(null);
        }}
        loading={isPending}
      />
    </div>
  );
}
