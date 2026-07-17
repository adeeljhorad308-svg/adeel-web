import { z } from 'zod';
import { zEmail, zNonEmpty } from '@/lib/validation';

/**
 * Authentication validation schemas (Stage 5 §3, §7). Password policy enforces a
 * reasonable minimum strength without being hostile; the real defense is Argon2id
 * hashing plus rate limiting, not draconian composition rules.
 */

const strongPassword = z
  .string()
  .min(12, 'Use at least 12 characters.')
  .max(128, 'That password is too long.')
  .regex(/[a-z]/, 'Include a lowercase letter.')
  .regex(/[A-Z]/, 'Include an uppercase letter.')
  .regex(/[0-9]/, 'Include a number.');

export const loginSchema = z.object({
  email: zEmail,
  password: zNonEmpty('Password'),
  rememberMe: z.boolean().optional().default(false),
});
export type LoginInput = z.infer<typeof loginSchema>;

export const forgotPasswordSchema = z.object({
  email: zEmail,
});
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z
  .object({
    token: zNonEmpty('Token'),
    password: strongPassword,
    confirmPassword: zNonEmpty('Confirm password'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
  });
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;

export const verifyEmailSchema = z.object({
  token: zNonEmpty('Token'),
});

export const twoFactorSchema = z.object({
  code: z
    .string()
    .trim()
    .regex(/^\d{6}$/, 'Enter the 6-digit code.'),
});
export type TwoFactorInput = z.infer<typeof twoFactorSchema>;
