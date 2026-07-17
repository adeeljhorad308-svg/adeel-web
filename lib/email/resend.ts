import 'server-only';
import { Resend } from 'resend';
import { serverEnv } from '@/lib/config/env';
import { logger } from '@/lib/logging/logger';

/**
 * Resend transactional email adapter (Stage 5 §17).
 *
 * Actual sending in production is dispatched through the background job system so
 * a slow provider never blocks a request (Stage 5 improvement). This adapter is
 * the low-level send primitive the email job invokes; it can also be called
 * directly for synchronous flows in development/testing.
 */

const resend = new Resend(serverEnv.RESEND_API_KEY);

export interface SendEmailInput {
  readonly to: string | string[];
  readonly subject: string;
  readonly html: string;
  readonly text?: string;
  readonly replyTo?: string;
}

export async function sendEmail(input: SendEmailInput): Promise<{ id: string }> {
  const { data, error } = await resend.emails.send({
    from: serverEnv.EMAIL_FROM,
    to: input.to,
    subject: input.subject,
    html: input.html,
    ...(input.text !== undefined ? { text: input.text } : {}),
    ...(input.replyTo !== undefined ? { replyTo: input.replyTo } : {}),
  });

  if (error || !data) {
    logger.error({ err: error }, 'Resend failed to send email');
    throw new Error(`Email delivery failed: ${error?.message ?? 'unknown error'}`);
  }
  return { id: data.id };
}
