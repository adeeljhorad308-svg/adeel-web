'use server';

import {
  subscribeNewsletter as _subscribeNewsletter,
  confirmNewsletterSubscription as _confirmNewsletterSubscription,
} from '@/lib/services/newsletter-service';

/** Server Action boundary for the Newsletter module (see blog-actions.ts for rationale). */
export async function subscribeNewsletter(input: unknown) {
  return _subscribeNewsletter(input);
}

export async function confirmNewsletterSubscription(token: string) {
  return _confirmNewsletterSubscription(token);
}
