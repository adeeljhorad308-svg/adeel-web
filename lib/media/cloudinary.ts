import 'server-only';
import { v2 as cloudinary } from 'cloudinary';
import { serverEnv } from '@/lib/config/env';

/**
 * Cloudinary media adapter (Stage 5 §9).
 *
 * BUILD-READINESS FIX: uploads are performed server-side (via `uploadBuffer`,
 * invoked from the /api/v1/media/upload route handler) rather than the client
 * uploading directly to Cloudinary. The original direct-upload design meant
 * our server never saw the raw file bytes, so the MIME-sniffing validator and
 * SVG sanitizer that already existed in this codebase were never actually
 * invoked — files were trusted based only on the browser's (trivially
 * spoofable) declared type. Routing uploads through our server closes that
 * gap: every byte is validated and sanitized before Cloudinary ever sees it.
 *
 * The previous signed-direct-upload helper was deleted entirely (not just
 * unused) rather than left in the file, since dead code implementing a
 * pattern already proven insecure is exactly the kind of thing that gets
 * accidentally re-wired later.
 */

cloudinary.config({
  cloud_name: serverEnv.CLOUDINARY_CLOUD_NAME ?? '',
  api_key: serverEnv.CLOUDINARY_API_KEY ?? '',
  api_secret: serverEnv.CLOUDINARY_API_SECRET ?? '',
  secure: true,
});

/** Permanently delete an asset by its Cloudinary public id. */
export async function deleteAsset(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId, { invalidate: true });
}

export interface UploadResult {
  readonly url: string;
  readonly publicId: string;
  readonly width?: number;
  readonly height?: number;
  readonly bytes: number;
}

/**
 * Upload a validated buffer to Cloudinary from the server. The buffer has
 * already passed `validateUpload`/sanitization by the time this is called
 * (see app/api/v1/media/upload/route.ts, the sole caller).
 */
export async function uploadBuffer(
  buffer: Buffer,
  folder: string,
  resourceType: 'image' | 'video' | 'raw',
): Promise<UploadResult> {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      { folder, resource_type: resourceType },
      (error, result) => {
        if (error || !result) {
          reject(new Error(error?.message ?? 'Cloudinary upload returned no result.'));
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          width: result.width,
          height: result.height,
          bytes: result.bytes,
        });
      },
    );
    stream.end(buffer);
  });
}

export { cloudinary };
