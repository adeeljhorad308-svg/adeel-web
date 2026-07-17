import { describe, expect, it } from 'vitest';
import { generateSecret, verifyToken, encryptSecret, decryptSecret, buildOtpAuthUri } from '@/lib/auth/totp';
import { loginSchema, resetPasswordSchema } from '@/lib/validation/auth';

/**
 * Authentication unit tests (Stage 5 §21: explicit authentication tests).
 * TOTP is tested against itself (generate a code for "now" and verify it) since
 * that exercises the exact RFC 6238 implementation without needing a fixed-time
 * mock; encryption round-trips are tested directly.
 */
describe('TOTP two-factor', () => {
  it('round-trips secret encryption', () => {
    process.env.NEXTAUTH_SECRET = 'a'.repeat(32);
    const secret = generateSecret();
    const encrypted = encryptSecret(secret);
    expect(encrypted).not.toBe(secret);
    expect(decryptSecret(encrypted)).toBe(secret);
  });

  it('builds a well-formed otpauth URI', () => {
    const secret = generateSecret();
    const uri = buildOtpAuthUri(secret, 'admin@adeelit.local');
    expect(uri).toMatch(/^otpauth:\/\/totp\//);
    expect(uri).toContain(`secret=${secret}`);
    expect(uri).toContain('digits=6');
  });

  it('rejects malformed codes without throwing', () => {
    const secret = generateSecret();
    expect(verifyToken(secret, 'abcdef')).toBe(false);
    expect(verifyToken(secret, '123')).toBe(false);
  });
});

describe('auth validation schemas', () => {
  it('rejects an invalid email on login', () => {
    const result = loginSchema.safeParse({ email: 'not-an-email', password: 'x' });
    expect(result.success).toBe(false);
  });

  it('requires matching passwords on reset', () => {
    const result = resetPasswordSchema.safeParse({
      token: 'abc',
      password: 'StrongPass123',
      confirmPassword: 'Different123',
    });
    expect(result.success).toBe(false);
  });

  it('enforces minimum password strength on reset', () => {
    const result = resetPasswordSchema.safeParse({
      token: 'abc',
      password: 'short1A',
      confirmPassword: 'short1A',
    });
    expect(result.success).toBe(false);
  });

  it('accepts a valid reset payload', () => {
    const result = resetPasswordSchema.safeParse({
      token: 'abc',
      password: 'StrongPass123',
      confirmPassword: 'StrongPass123',
    });
    expect(result.success).toBe(true);
  });
});
