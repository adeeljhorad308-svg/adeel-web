import 'server-only';
import {
  createHmac,
  randomBytes,
  timingSafeEqual,
  createCipheriv,
  createDecipheriv,
  createHash,
} from 'node:crypto';
import { serverEnv } from '@/lib/config/env';

/**
 * TOTP two-factor authentication (Stage 5 §7; Master Spec: 2FA).
 *
 * Implements RFC 6238 (TOTP) over RFC 4226 (HOTP) using Node crypto — no external
 * dependency. Secrets are stored encrypted at rest with AES-256-GCM, keyed from
 * NEXTAUTH_SECRET, so a database leak does not expose usable TOTP seeds.
 *
 * Verification allows a ±1 step (30s) window to tolerate clock skew and uses a
 * constant-time comparison.
 */

const DIGITS = 6;
const PERIOD_SECONDS = 30;
const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

// --- Base32 (RFC 4648) for authenticator-app compatibility ---

function toBase32(buffer: Buffer): string {
  let bits = 0;
  let value = 0;
  let output = '';
  for (const byte of buffer) {
    value = (value << 8) | byte;
    bits += 8;
    while (bits >= 5) {
      output += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }
  if (bits > 0) {
    output += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }
  return output;
}

function fromBase32(input: string): Buffer {
  const clean = input.replace(/=+$/, '').toUpperCase();
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];
  for (const char of clean) {
    const idx = BASE32_ALPHABET.indexOf(char);
    if (idx === -1) continue;
    value = (value << 5) | idx;
    bits += 5;
    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 0xff);
      bits -= 8;
    }
  }
  return Buffer.from(bytes);
}

// --- Secret encryption at rest (AES-256-GCM) ---

function encryptionKey(): Buffer {
  if (!serverEnv.NEXTAUTH_SECRET) {
    throw new Error(
      'NEXTAUTH_SECRET is required for TOTP secret encryption but is not configured.',
    );
  }
  return createHash('sha256').update(serverEnv.NEXTAUTH_SECRET).digest();
}

/** Encrypt a base32 secret for storage. Format: iv:authTag:ciphertext (base64). */
export function encryptSecret(secretBase32: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const encrypted = Buffer.concat([cipher.update(secretBase32, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return [iv.toString('base64'), authTag.toString('base64'), encrypted.toString('base64')].join(
    ':',
  );
}

/** Decrypt a stored secret back to base32. */
export function decryptSecret(stored: string): string {
  const [ivB64, tagB64, dataB64] = stored.split(':');
  if (!ivB64 || !tagB64 || !dataB64) throw new Error('Malformed 2FA secret.');
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return Buffer.concat([
    decipher.update(Buffer.from(dataB64, 'base64')),
    decipher.final(),
  ]).toString('utf8');
}

// --- TOTP core ---

function hotp(secret: Buffer, counter: number): string {
  const counterBuffer = Buffer.alloc(8);
  counterBuffer.writeBigInt64BE(BigInt(counter));
  const digest = createHmac('sha1', secret).update(counterBuffer).digest();

  // SHA-1 always produces exactly 20 bytes, so every index below is guaranteed
  // in-bounds by the algorithm's fixed output size — not by runtime luck. Using
  // `.at()` with an explicit fallback (rather than `!`) keeps this true under
  // strict mode without asserting away a check we can instead just satisfy.
  const readByte = (index: number): number => {
    const byte = digest.at(index);
    if (byte === undefined) {
      // Unreachable for a real SHA-1 digest; fail loudly rather than silently
      // producing a wrong code if this invariant is ever violated.
      throw new Error('Unexpected HMAC digest length.');
    }
    return byte;
  };

  const offset = readByte(digest.length - 1) & 0x0f;
  const binary =
    ((readByte(offset) & 0x7f) << 24) |
    ((readByte(offset + 1) & 0xff) << 16) |
    ((readByte(offset + 2) & 0xff) << 8) |
    (readByte(offset + 3) & 0xff);
  return (binary % 10 ** DIGITS).toString().padStart(DIGITS, '0');
}

/** Generate a new random base32 TOTP secret. */
export function generateSecret(): string {
  return toBase32(randomBytes(20));
}

/** Build the otpauth:// URI an authenticator app scans as a QR code. */
export function buildOtpAuthUri(secretBase32: string, accountEmail: string): string {
  const issuer = encodeURIComponent('Adeel IT Solutions');
  const account = encodeURIComponent(accountEmail);
  return `otpauth://totp/${issuer}:${account}?secret=${secretBase32}&issuer=${issuer}&algorithm=SHA1&digits=${DIGITS}&period=${PERIOD_SECONDS}`;
}

/** Verify a 6-digit code against the secret, allowing ±1 time step. */
export function verifyToken(secretBase32: string, code: string): boolean {
  if (!/^\d{6}$/.test(code)) return false;
  const secret = fromBase32(secretBase32);
  const counter = Math.floor(Date.now() / 1000 / PERIOD_SECONDS);
  for (const drift of [-1, 0, 1]) {
    const expected = hotp(secret, counter + drift);
    const a = Buffer.from(expected);
    const b = Buffer.from(code);
    if (a.length === b.length && timingSafeEqual(a, b)) return true;
  }
  return false;
}
