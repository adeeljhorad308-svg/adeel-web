import { task } from '@trigger.dev/sdk/v3';
import { z } from 'zod';
import { sendEmail } from '@/lib/email/resend';

/**
 * Email delivery job (Stage 5 §15, §17). Domain code enqueues this task rather
 * than calling the provider inline, so a slow or failing provider never blocks a
 * user request. Retries are handled by Trigger.dev per the global config.
 */
const payloadSchema = z.object({
  to: z.union([z.string().email(), z.array(z.string().email())]),
  subject: z.string().min(1),
  html: z.string().min(1),
  text: z.string().optional(),
  replyTo: z.string().email().optional(),
});

export const sendEmailTask = task({
  id: 'send-email',
  run: async (rawPayload: unknown) => {
    const payload = payloadSchema.parse(rawPayload);
    const result = await sendEmail({
      to: payload.to,
      subject: payload.subject,
      html: payload.html,
      ...(payload.text !== undefined ? { text: payload.text } : {}),
      ...(payload.replyTo !== undefined ? { replyTo: payload.replyTo } : {}),
    });
    return { emailId: result.id };
  },
});
