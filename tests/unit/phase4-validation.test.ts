import { describe, expect, it } from 'vitest';
import { contactFormSchema } from '@/lib/validation/contact';
import { upsertLeadSchema } from '@/lib/validation/crm';
import { newsletterSubscribeSchema } from '@/lib/validation/newsletter';

describe('contact form validation', () => {
  it('rejects the honeypot field being filled', () => {
    const result = contactFormSchema.safeParse({
      name: 'A',
      email: 'a@b.com',
      message: 'hi',
      website: 'spam',
    });
    expect(result.success).toBe(false);
  });
  it('accepts a valid submission with the honeypot empty', () => {
    const result = contactFormSchema.safeParse({
      name: 'A',
      email: 'a@b.com',
      message: 'hi',
      website: '',
    });
    expect(result.success).toBe(true);
  });
});

describe('lead validation', () => {
  it('requires a valid email', () => {
    const result = upsertLeadSchema.safeParse({ name: 'A', email: 'not-an-email' });
    expect(result.success).toBe(false);
  });
  it('defaults status and priority', () => {
    const result = upsertLeadSchema.safeParse({ name: 'A', email: 'a@b.com' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.status).toBe('NEW');
      expect(result.data.priority).toBe('MEDIUM');
    }
  });
});

describe('newsletter validation', () => {
  it('rejects an invalid email', () => {
    expect(newsletterSubscribeSchema.safeParse({ email: 'bad' }).success).toBe(false);
  });
});
