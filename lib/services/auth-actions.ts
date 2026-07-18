'use server';

import { isRedirectError } from 'next/dist/client/components/redirect-error';
import { prisma } from '@/lib/db/prisma';
import { signIn, signOut, auth } from '@/lib/auth/config';
import { requireUser } from '@/lib/auth/guards';
import { verifyPassword, hashPassword } from '@/lib/auth/password';
import { verifyToken as verifyTotp, decryptSecret } from '@/lib/auth/totp';
import { issueToken, consumeToken } from '@/lib/auth/tokens';
import {
  loginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  twoFactorSchema,
} from '@/lib/validation/auth';
import { parseOrThrow } from '@/lib/validation';
import { enforceRateLimit, getClientIp } from '@/lib/security/request';
import { recordActivity } from '@/lib/logging/activity';
import { enqueueEmail } from '@/lib/jobs/client';
import { passwordResetEmail } from '@/lib/email/templates';
import { logger } from '@/lib/logging/logger';
import { AppError, UnauthenticatedError, toErrorEnvelope } from '@/lib/errors';
import type { ActionResult } from '@/lib/types';

/**
 * Authentication Server Actions (Stage 5 §7). Each action rate-limits, validates,
 * performs the security-sensitive operation, records an activity log, and returns
 * the typed ActionResult envelope. Errors never leak internal detail.
 *
 * Login is a two-step flow to accommodate 2FA:
 *   1. `login` verifies the first factor (email + password). If the account has
 *      2FA enabled, it returns `{ requiresTwoFactor: true }` WITHOUT creating a
 *      session — the client then collects a code and calls `loginWithTwoFactor`.
 *   2. `loginWithTwoFactor` re-verifies the password, checks the TOTP code, and
 *      only then creates the session via Auth.js.
 */

function toResult(error: unknown): ActionResult<never> {
  const { body } = toErrorEnvelope(error);
  return { ok: false, error: body.error };
}

interface LoginSuccess {
  requiresTwoFactor: boolean;
}

export async function login(formData: unknown): Promise<ActionResult<LoginSuccess>> {
  try {
    const input = parseOrThrow(loginSchema, formData);
    const ip = await getClientIp();
    await enforceRateLimit('auth', `login:${ip}:${input.email}`);

    const user = await prisma.user.findUnique({ where: { email: input.email } });

    if (!user?.passwordHash || user.status === 'SUSPENDED') {
      await recordActivity({ action: 'auth.login.failed', ip, metadata: { email: input.email } });
      throw new UnauthenticatedError('Invalid email or password.');
    }

    const valid = await verifyPassword(user.passwordHash, input.password);
    if (!valid) {
      await recordActivity({
        actorId: user.id,
        action: 'auth.login.failed',
        ip,
        metadata: { email: input.email },
      });
      throw new UnauthenticatedError('Invalid email or password.');
    }

    if (user.twoFactorEnabled) {
      // First factor OK; defer session creation until the TOTP code is verified.
      return { ok: true, data: { requiresTwoFactor: true } };
    }

    await signIn('credentials', {
      email: input.email,
      password: input.password,
      redirect: false,
    });

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await recordActivity({ actorId: user.id, action: 'auth.login', ip });

    return { ok: true, data: { requiresTwoFactor: false } };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (!(error instanceof AppError)) {
      logger.error({ err: error }, 'Unexpected error in login action');
    }
    return toResult(error);
  }
}

export async function loginWithTwoFactor(
  formData: unknown,
): Promise<ActionResult<{ verified: boolean }>> {
  try {
    const base = parseOrThrow(loginSchema, formData);
    const { code } = parseOrThrow(twoFactorSchema, formData);
    const ip = await getClientIp();
    await enforceRateLimit('auth', `2fa:${ip}:${base.email}`);

    const user = await prisma.user.findUnique({ where: { email: base.email } });
    if (!user?.passwordHash || !user.twoFactorEnabled || !user.twoFactorSecret) {
      throw new UnauthenticatedError('Invalid email or password.');
    }

    const passwordValid = await verifyPassword(user.passwordHash, base.password);
    if (!passwordValid) {
      throw new UnauthenticatedError('Invalid email or password.');
    }

    const secret = decryptSecret(user.twoFactorSecret);
    if (!verifyTotp(secret, code)) {
      await recordActivity({ actorId: user.id, action: 'auth.2fa.failed', ip });
      throw new UnauthenticatedError('That code is incorrect or expired.');
    }

    await signIn('credentials', {
      email: base.email,
      password: base.password,
      redirect: false,
    });

    await prisma.user.update({ where: { id: user.id }, data: { lastLoginAt: new Date() } });
    await recordActivity({
      actorId: user.id,
      action: 'auth.login',
      ip,
      metadata: { method: '2fa' },
    });

    return { ok: true, data: { verified: true } };
  } catch (error) {
    if (isRedirectError(error)) throw error;
    if (!(error instanceof AppError)) {
      logger.error({ err: error }, 'Unexpected error in 2FA login action');
    }
    return toResult(error);
  }
}

export async function requestPasswordReset(
  formData: unknown,
): Promise<ActionResult<{ sent: true }>> {
  try {
    const input = parseOrThrow(forgotPasswordSchema, formData);
    const ip = await getClientIp();
    await enforceRateLimit('auth', `reset:${ip}:${input.email}`);

    const user = await prisma.user.findUnique({ where: { email: input.email } });

    // Always respond as if sent — never reveal whether an account exists.
    if (user && user.status !== 'SUSPENDED') {
      const { token } = await issueToken(input.email, 'PASSWORD_RESET');
      const email = passwordResetEmail(token);
      await enqueueEmail({
        to: input.email,
        subject: email.subject,
        html: email.html,
        text: email.text,
      });
      await recordActivity({ actorId: user.id, action: 'auth.password.reset_requested', ip });
    }

    return { ok: true, data: { sent: true } };
  } catch (error) {
    if (!(error instanceof AppError)) {
      logger.error({ err: error }, 'Unexpected error in password reset request');
    }
    return toResult(error);
  }
}

export async function resetPassword(formData: unknown): Promise<ActionResult<{ reset: true }>> {
  try {
    const input = parseOrThrow(resetPasswordSchema, formData);
    const ip = await getClientIp();
    await enforceRateLimit('auth', `reset-submit:${ip}`);

    const identifier = await consumeToken(input.token, 'PASSWORD_RESET');
    if (!identifier) {
      throw new UnauthenticatedError('This reset link is invalid or has expired.');
    }

    const user = await prisma.user.findUnique({ where: { email: identifier } });
    if (!user) {
      throw new UnauthenticatedError('This reset link is invalid or has expired.');
    }

    const passwordHash = await hashPassword(input.password);

    // Update the password and revoke all existing sessions in one transaction so a
    // compromised session cannot survive a password reset.
    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash,
          status: user.status === 'INVITED' ? 'ACTIVE' : user.status,
          emailVerified: user.emailVerified ?? new Date(),
        },
      });
      await tx.session.deleteMany({ where: { userId: user.id } });
      await recordActivity({ actorId: user.id, action: 'auth.password.reset', ip }, tx);
    });

    return { ok: true, data: { reset: true } };
  } catch (error) {
    if (!(error instanceof AppError)) {
      logger.error({ err: error }, 'Unexpected error in password reset');
    }
    return toResult(error);
  }
}

export async function logout(): Promise<void> {
  const ip = await getClientIp();
  const session = await auth();
  const dbSessionId = session?.dbSessionId;

  await recordActivity({ action: 'auth.logout', ip });

  // Delete our DB-backed session row so the JWT (even if it somehow survived
  // client-side) is rejected by the `session` callback on any future request —
  // clearing only the cookie is not sufficient revocation on its own.
  if (dbSessionId) {
    await prisma.session.delete({ where: { id: dbSessionId } }).catch(() => {
      // Already gone (e.g. concurrent logout) — not an error condition.
    });
  }

  await signOut({ redirect: false });
}

/** Sign out of every active session for the current user ("logout all devices"). */
export async function logoutAllDevices(): Promise<ActionResult<{ loggedOut: true }>> {
  try {
    const user = await requireUser();
    await prisma.session.deleteMany({ where: { userId: user.id } });
    await recordActivity({ actorId: user.id, action: 'auth.logout_all' });
    await signOut({ redirect: false });
    return { ok: true, data: { loggedOut: true } };
  } catch (error) {
    if (!(error instanceof AppError)) {
      logger.error({ err: error }, 'Unexpected error in logoutAllDevices');
    }
    return toResult(error);
  }
}

export async function verifyEmailToken(token: string): Promise<ActionResult<{ verified: true }>> {
  try {
    const identifier = await consumeToken(token, 'EMAIL_VERIFICATION');
    if (!identifier) {
      throw new UnauthenticatedError('This verification link is invalid or has expired.');
    }
    const user = await prisma.user.findUnique({ where: { email: identifier } });
    if (!user) {
      throw new UnauthenticatedError('This verification link is invalid or has expired.');
    }
    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: new Date(),
        status: user.status === 'INVITED' ? 'ACTIVE' : user.status,
      },
    });
    await recordActivity({ actorId: user.id, action: 'auth.email.verified' });
    return { ok: true, data: { verified: true } };
  } catch (error) {
    if (!(error instanceof AppError)) {
      logger.error({ err: error }, 'Unexpected error in email verification');
    }
    return toResult(error);
  }
}
