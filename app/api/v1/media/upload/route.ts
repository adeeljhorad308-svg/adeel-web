import { NextResponse, type NextRequest } from 'next/server';
import { requirePermission } from '@/lib/auth/guards';
import { validateUpload } from '@/lib/media/validation';
import { sanitizeSvg } from '@/lib/security/sanitize';
import { uploadBuffer } from '@/lib/media/cloudinary';
import { enforceRateLimit, enforceSameOrigin, getClientIp } from '@/lib/security/request';
import { success, toErrorEnvelope, ValidationError } from '@/lib/errors';
import { logger } from '@/lib/logging/logger';

/**
 * Media upload Route Handler (Stage 5 §9; build-readiness fix).
 *
 * Replaces the previous direct-to-Cloudinary client upload. The file's raw
 * bytes are received here, sniffed by magic number (not trusted from the
 * browser's declared MIME type), sanitized if SVG, and only then uploaded to
 * Cloudinary from the server. This is the sole path by which file content
 * reaches Cloudinary — `finalizeUpload` (the Server Action) now only persists
 * the `Media` row from this route's already-validated result, it does not
 * accept arbitrary client-supplied URLs/metadata for new uploads.
 *
 * A Route Handler (not a Server Action) is used because Server Actions do not
 * support streaming `multipart/form-data` file bodies as cleanly as a Request
 * object's `.formData()`, and this endpoint may also serve non-browser clients
 * in the future (Stage 5 §17 "Mobile App API").
 *
 * CSRF (build-readiness fix): Server Actions get automatic same-origin
 * enforcement from Next.js; plain Route Handlers do not. Since this is a
 * mutating, cookie-authenticated endpoint, `enforceSameOrigin()` explicitly
 * rejects cross-origin requests before any other work happens.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    await enforceSameOrigin();
    await requirePermission('MEDIA', 'CREATE');

    const ip = await getClientIp();
    await enforceRateLimit('mutation', `media-upload:${ip}`);

    const formData = await request.formData();
    const file = formData.get('file');
    const folder = (formData.get('folder') as string | null) ?? 'adeel-it';

    if (!(file instanceof File)) {
      throw new ValidationError('No file was provided.');
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { sniffedMime, category } = validateUpload(buffer, file.type, file.size);

    const finalBuffer = sniffedMime === 'image/svg+xml' ? Buffer.from(sanitizeSvg(buffer.toString('utf8'))) : buffer;

    const resourceType = category === 'video' ? 'video' : category === 'document' ? 'raw' : 'image';
    const result = await uploadBuffer(finalBuffer, folder, resourceType);

    return NextResponse.json(
      success({
        url: result.url,
        publicId: result.publicId,
        mimeType: sniffedMime,
        sizeBytes: result.bytes,
        width: result.width,
        height: result.height,
      }),
      { status: 200 },
    );
  } catch (error) {
    logger.error({ err: error }, 'Media upload failed');
    const { body, status } = toErrorEnvelope(error);
    return NextResponse.json(body, { status });
  }
}
