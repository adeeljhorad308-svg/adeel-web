import 'server-only';
import { createHash, randomBytes } from 'node:crypto';
import { prisma } from '@/lib/db/prisma';
import type { Prisma, VerificationTokenType } from '@prisma/client';

/**
 * Verification token service (Stage 5 §7).
 *
 * Tokens are random, single-use, and expiring. Only a SHA-256 hash of the token
 * is stored — the raw token is returned once to be emailed. A leaked database
 * therefore cannot be used to forge reset/verify links. Consumption is atomic:
 * a token is validated and deleted in one transaction so it cannot be reused.
 */

const TTL_MINUTES: Record<VerificationTokenType, number> = {
  EMAIL_VERIFICATION: 60 * 24, // 24h
  PASSWORD_RESET: 60, // 1h
  INVITE: 60 * 24 * 7, // 7d
};

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

/** Issue a token, returning the RAW token (to email) and its expiry. */
export async function issueToken(
  identifier: string,
  type: VerificationTokenType,
  tx?: Prisma.TransactionClient,
): Promise<{ token: string; expires: Date }> {
  const client = tx ?? prisma;
  const raw = randomBytes(32).toString('base64url');
  const tokenHash = hashToken(raw);
  const expires = new Date(Date.now() + TTL_MINUTES[type] * 60 * 1000);

  // Invalidate any prior tokens of this type for this identifier.
  await client.verificationToken.deleteMany({ where: { identifier, type } });
  await client.verificationToken.create({
    data: { identifier, tokenHash, type, expires },
  });

  return { token: raw, expires };
}

/**
 * Atomically validate and consume a token. Returns the identifier it was issued
 * for, or null if the token is invalid/expired. The token is deleted on success
 * so it cannot be replayed.
 */
export async function consumeToken(
  raw: string,
  type: VerificationTokenType,
): Promise<string | null> {
  const tokenHash = hashToken(raw);

  return prisma.$transaction(async (tx) => {
    const record = await tx.verificationToken.findUnique({ where: { tokenHash } });
    if (!record || record.type !== type || record.expires < new Date()) {
      // Clean up an expired record if present.
      if (record) await tx.verificationToken.delete({ where: { tokenHash } });
      return null;
    }
    await tx.verificationToken.delete({ where: { tokenHash } });
    return record.identifier;
  });
}
