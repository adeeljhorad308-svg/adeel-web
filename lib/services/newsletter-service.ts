import 'server-only';
import { prisma } from '@/lib/db/prisma';
import { parseOrThrow } from '@/lib/validation';
import { newsletterSubscribeSchema } from '@/lib/validation/newsletter';
import { enforceRateLimit, getClientIp } from '@/lib/security/request';
import { issueToken, consumeToken } from '@/lib/auth/tokens';
import { enqueueEmail } from '@/lib/jobs/client';
import { clientEnv } from '@/lib/config/env';
import { toActionError } from '@/lib/services/action-result';
import { ValidationError } from '@/lib/errors';
import type { ActionResult } from '@/lib/types';

/** Newsletter (Stage 2 §12; double opt-in). */
export async function subscribeNewsletter(
  input: unknown,
): Promise<ActionResult<{ subscribed: true }>> {
  try {
    const data = parseOrThrow(newsletterSubscribeSchema, input);
    const ip = await getClientIp();
    await enforceRateLimit('publicForm', `newsletter:${ip}`);

    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email: data.email } });
    if (existing?.status === 'CONFIRMED') {
      return { ok: true, data: { subscribed: true } };
    }
    await prisma.newsletterSubscriber.upsert({
      where: { email: data.email },
      create: { email: data.email, status: 'PENDING' },
      update: { status: 'PENDING' },
    });

    const { token } = await issueToken(data.email, 'EMAIL_VERIFICATION');
    const confirmUrl = `${clientEnv.NEXT_PUBLIC_APP_URL}/newsletter/confirm/${token}`;
    await enqueueEmail({
      to: data.email,
      subject: 'Confirm your subscription',
      html: `<p>Click to confirm: <a href="${confirmUrl}">${confirmUrl}</a></p>`,
      text: `Confirm your subscription: ${confirmUrl}`,
    });

    return { ok: true, data: { subscribed: true } };
  } catch (error) {
    return toActionError(error);
  }
}

export async function confirmNewsletterSubscription(
  token: string,
): Promise<ActionResult<{ confirmed: true }>> {
  try {
    const email = await consumeToken(token, 'EMAIL_VERIFICATION');
    if (!email) {
      throw new ValidationError('This confirmation link is invalid or has expired.');
    }
    await prisma.newsletterSubscriber.update({
      where: { email },
      data: { status: 'CONFIRMED', confirmedAt: new Date() },
    });
    return { ok: true, data: { confirmed: true } };
  } catch (error) {
    return toActionError(error);
  }
}
