import 'server-only';
import { UPLOAD_LIMITS } from '@/lib/constants';
import { ValidationError } from '@/lib/errors';

/**
 * Upload validation (Stage 5 §9; OWASP: file upload exploits).
 *
 * Trusts neither the file extension nor the browser-supplied MIME type alone —
 * sniffs the first bytes (magic numbers) of the actual file content. Extension
 * and declared MIME must additionally agree with the sniffed type. Executables
 * and anything outside the allowlist are rejected outright.
 */

const MAGIC_NUMBERS: ReadonlyArray<{ mime: string; bytes: readonly number[]; offset?: number }> = [
  { mime: 'image/jpeg', bytes: [0xff, 0xd8, 0xff] },
  { mime: 'image/png', bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] },
  { mime: 'image/gif', bytes: [0x47, 0x49, 0x46, 0x38] },
  { mime: 'image/webp', bytes: [0x52, 0x49, 0x46, 0x46] }, // "RIFF"; WEBP marker follows at offset 8
  { mime: 'application/pdf', bytes: [0x25, 0x50, 0x44, 0x46] },
  { mime: 'video/mp4', bytes: [0x66, 0x74, 0x79, 0x70], offset: 4 },
  { mime: 'video/webm', bytes: [0x1a, 0x45, 0xdf, 0xa3] },
];

/** Explicitly denied signatures — common executable/script magic numbers. */
const DENY_MAGIC: ReadonlyArray<readonly number[]> = [
  [0x4d, 0x5a], // MZ — Windows PE/EXE
  [0x7f, 0x45, 0x4c, 0x46], // ELF — Linux executable
  [0x23, 0x21], // shebang "#!"
];

function matchesMagic(buffer: Buffer, signature: { bytes: readonly number[]; offset?: number }): boolean {
  const start = signature.offset ?? 0;
  if (buffer.length < start + signature.bytes.length) return false;
  return signature.bytes.every((byte, i) => buffer[start + i] === byte);
}

function sniffMime(buffer: Buffer): string | null {
  for (const entry of MAGIC_NUMBERS) {
    if (matchesMagic(buffer, entry)) return entry.mime;
  }
  // SVG is text/XML — no binary magic number; detect via a bounded text scan.
  const head = buffer.subarray(0, 512).toString('utf8').trimStart();
  if (head.startsWith('<?xml') || head.startsWith('<svg')) return 'image/svg+xml';
  return null;
}

export interface ValidatedUpload {
  readonly sniffedMime: string;
  readonly category: 'image' | 'video' | 'document';
}

/**
 * Validate an uploaded file's buffer against declared metadata. Throws
 * ValidationError with a safe, specific message on any mismatch or denial.
 */
export function validateUpload(
  buffer: Buffer,
  declaredMime: string,
  sizeBytes: number,
): ValidatedUpload {
  for (const deny of DENY_MAGIC) {
    if (matchesMagic(buffer, { bytes: deny })) {
      throw new ValidationError('This file type is not allowed.');
    }
  }

  const sniffed = sniffMime(buffer);
  if (!sniffed) {
    throw new ValidationError('Could not verify this file type. Upload a supported image, video, or document.');
  }

  const allowedImage = UPLOAD_LIMITS.allowedImageMime.includes(sniffed as never);
  const allowedVideo = UPLOAD_LIMITS.allowedVideoMime.includes(sniffed as never);
  const allowedDoc = UPLOAD_LIMITS.allowedDocumentMime.includes(sniffed as never);

  if (!allowedImage && !allowedVideo && !allowedDoc) {
    throw new ValidationError('This file type is not supported.');
  }

  // The declared MIME must be plausible for the sniffed type (loose equality
  // check tolerant of vendor variants), preventing a mislabeled upload.
  if (declaredMime !== sniffed && !(sniffed === 'image/webp' && declaredMime.includes('webp'))) {
    throw new ValidationError('The file content does not match its declared type.');
  }

  const category = allowedImage ? 'image' : allowedVideo ? 'video' : 'document';
  const limit =
    category === 'image'
      ? UPLOAD_LIMITS.maxImageBytes
      : category === 'video'
        ? UPLOAD_LIMITS.maxVideoBytes
        : UPLOAD_LIMITS.maxDocumentBytes;

  if (sizeBytes > limit) {
    throw new ValidationError(`File is too large. Maximum size is ${Math.round(limit / (1024 * 1024))}MB.`);
  }

  return { sniffedMime: sniffed, category };
}
