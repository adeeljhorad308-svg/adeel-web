import { describe, expect, it } from 'vitest';
import { finalizeUploadSchema } from '@/lib/validation/media';
import { upsertServiceSchema } from '@/lib/validation/services';
import { upsertTestimonialSchema } from '@/lib/validation/testimonials';
import { saveNavigationMenuSchema } from '@/lib/validation/navigation';
import { themeConfigSchema } from '@/lib/validation/theme';

/**
 * Cross-module validation tests (Stage 5 §21: form validation tests). Covers the
 * optimistic-locking contract (version required on update) and each module's
 * domain-specific constraints.
 */
describe('optimistic locking contract', () => {
  it('rejects a Service update without a version', () => {
    const result = upsertServiceSchema.safeParse({
      id: 'clx0000000000000000000000',
      name: 'Web Development',
      slug: 'web-development',
      iconKey: 'Globe',
      shortBenefit: 'Ship fast',
    });
    expect(result.success).toBe(false);
  });

  it('accepts a Service create without a version (no id present)', () => {
    const result = upsertServiceSchema.safeParse({
      name: 'Web Development',
      slug: 'web-development',
      iconKey: 'Globe',
      shortBenefit: 'Ship fast',
    });
    expect(result.success).toBe(true);
  });

  it('accepts a Service update when a version is present', () => {
    const result = upsertServiceSchema.safeParse({
      id: 'clx0000000000000000000000',
      version: 3,
      name: 'Web Development',
      slug: 'web-development',
      iconKey: 'Globe',
      shortBenefit: 'Ship fast',
    });
    expect(result.success).toBe(true);
  });
});

describe('media validation schema', () => {
  it('rejects a negative or zero file size', () => {
    const result = finalizeUploadSchema.safeParse({
      publicId: 'abc',
      url: 'https://res.cloudinary.com/demo/image/upload/abc.png',
      mimeType: 'image/png',
      sizeBytes: 0,
    });
    expect(result.success).toBe(false);
  });

  it('accepts a well-formed finalize payload', () => {
    const result = finalizeUploadSchema.safeParse({
      publicId: 'abc',
      url: 'https://res.cloudinary.com/demo/image/upload/abc.png',
      mimeType: 'image/png',
      sizeBytes: 2048,
    });
    expect(result.success).toBe(true);
  });
});

describe('testimonial rating bounds', () => {
  it('rejects a rating above 5', () => {
    const result = upsertTestimonialSchema.safeParse({
      clientName: 'Jane Doe',
      rating: 6,
      reviewText: 'Great work.',
    });
    expect(result.success).toBe(false);
  });

  it('rejects a rating below 1', () => {
    const result = upsertTestimonialSchema.safeParse({
      clientName: 'Jane Doe',
      rating: 0,
      reviewText: 'Great work.',
    });
    expect(result.success).toBe(false);
  });

  it('accepts a rating of 5', () => {
    const result = upsertTestimonialSchema.safeParse({
      clientName: 'Jane Doe',
      rating: 5,
      reviewText: 'Great work.',
    });
    expect(result.success).toBe(true);
  });
});

describe('navigation menu schema', () => {
  it('requires at least a context and name', () => {
    const result = saveNavigationMenuSchema.safeParse({ context: 'HEADER', name: '', items: [] });
    expect(result.success).toBe(false);
  });

  it('accepts a valid menu with items', () => {
    const result = saveNavigationMenuSchema.safeParse({
      context: 'HEADER',
      name: 'primary',
      items: [{ label: 'Home', type: 'INTERNAL', href: '/', order: 0, visible: true }],
    });
    expect(result.success).toBe(true);
  });
});

describe('theme config schema', () => {
  it('rejects a malformed hex color', () => {
    const validTokens = {
      'bg-page': '#f8fafc',
      'bg-surface': '#ffffff',
      'bg-subtle': '#f1f5f9',
      'text-primary': '#020617',
      'text-body': '#334155',
      'text-muted': '#64748b',
      'border-default': '#e2e8f0',
      'brand-primary': '#2563eb',
      'brand-hover': '#1d4ed8',
      'brand-tint': '#eff6ff',
      'feedback-success': '#22c55e',
      'feedback-warning': '#f59e0b',
      'feedback-error': '#ef4444',
    };
    const result = themeConfigSchema.safeParse({
      tokensLight: { ...validTokens, 'brand-primary': 'not-a-color' },
      tokensDark: validTokens,
    });
    expect(result.success).toBe(false);
  });
});
