import 'server-only';
import { tasks } from '@trigger.dev/sdk/v3';

/**
 * Thin wrapper over the Trigger.dev task-trigger API (Stage 5 §15). Domain code
 * enqueues jobs through these helpers rather than importing the SDK directly, so
 * the job transport can be swapped or mocked in tests behind one boundary.
 */

/** Enqueue the email delivery job. */
export async function enqueueEmail(payload: {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  replyTo?: string;
}): Promise<void> {
  await tasks.trigger('send-email', payload);
}
