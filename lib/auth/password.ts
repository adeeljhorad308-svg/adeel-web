import 'server-only';
import argon2 from 'argon2';

/**
 * Password hashing (Stage 5 §7; Master Spec: Argon2id).
 *
 * Argon2id parameters follow OWASP guidance for interactive logins, balancing
 * resistance to GPU/ASIC attacks with acceptable server latency. Verification is
 * constant-time via the argon2 library. Never log or return raw passwords/hashes.
 */

const ARGON_OPTIONS: argon2.Options = {
  type: argon2.argon2id,
  memoryCost: 19_456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
};

export async function hashPassword(plain: string): Promise<string> {
  return argon2.hash(plain, ARGON_OPTIONS);
}

export async function verifyPassword(hash: string, plain: string): Promise<boolean> {
  try {
    return await argon2.verify(hash, plain);
  } catch {
    // A malformed hash should read as a failed verification, not an exception.
    return false;
  }
}
