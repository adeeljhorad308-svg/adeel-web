import { describe, expect, it } from 'vitest';
import { estimateReadingTime } from '@/lib/utils';
import { upsertPostSchema } from '@/lib/validation/blog';
import { upsertFaqSchema } from '@/lib/validation/faq';
import { seoOverrideSchema } from '@/lib/validation/seo';

describe('reading time estimation', () => {
  it('returns 1 minute minimum for very short content', () => {
    expect(estimateReadingTime('<p>Hi</p>')).toBe(1);
  });

  it('strips HTML tags before counting words', () => {
    const html = '<p>' + 'word '.repeat(200) + '</p>';
    // 200 words at 200wpm = 1 minute exactly, ceil'd.
    expect(estimateReadingTime(html)).toBe(1);
  });

  it('scales with word count', () => {
    const html = '<p>' + 'word '.repeat(450) + '</p>';
    // 450 words / 200 wpm = 2.25 -> ceil to 3
    expect(estimateReadingTime(html)).toBe(3);
  });

  it('handles empty content without throwing', () => {
    expect(estimateReadingTime('')).toBe(1);
    expect(estimateReadingTime('<p></p>')).toBe(1);
  });
});

describe('blog post validation', () => {
  it('requires scheduledAt when status is SCHEDULED', () => {
    const result = upsertPostSchema.safeParse({
      title: 'My Post',
      slug: 'my-post',
      contentRich: '<p>Content</p>',
      status: 'SCHEDULED',
    });
    expect(result.success).toBe(false);
  });

  it('accepts SCHEDULED with a scheduledAt provided', () => {
    const result = upsertPostSchema.safeParse({
      title: 'My Post',
      slug: 'my-post',
      contentRich: '<p>Content</p>',
      status: 'SCHEDULED',
      scheduledAt: new Date(Date.now() + 86400000).toISOString(),
    });
    expect(result.success).toBe(true);
  });

  it('does not require scheduledAt for DRAFT', () => {
    const result = upsertPostSchema.safeParse({
      title: 'My Post',
      slug: 'my-post',
      contentRich: '<p>Content</p>',
      status: 'DRAFT',
    });
    expect(result.success).toBe(true);
  });

  it('rejects empty content', () => {
    const result = upsertPostSchema.safeParse({
      title: 'My Post',
      slug: 'my-post',
      contentRich: '',
      status: 'DRAFT',
    });
    expect(result.success).toBe(false);
  });
});

describe('FAQ validation', () => {
  it('requires both question and answer', () => {
    const result = upsertFaqSchema.safeParse({ question: '', answer: '' });
    expect(result.success).toBe(false);
  });

  it('accepts a valid FAQ', () => {
    const result = upsertFaqSchema.safeParse({ question: 'Q?', answer: 'A.' });
    expect(result.success).toBe(true);
  });
});

describe('SEO override validation', () => {
  it('requires a page path', () => {
    const result = seoOverrideSchema.safeParse({ pagePath: '' });
    expect(result.success).toBe(false);
  });

  it('enforces the 70-character title limit', () => {
    const result = seoOverrideSchema.safeParse({
      pagePath: '/services',
      title: 'x'.repeat(71),
    });
    expect(result.success).toBe(false);
  });

  it('accepts a minimal valid override', () => {
    const result = seoOverrideSchema.safeParse({ pagePath: '/services' });
    expect(result.success).toBe(true);
  });
});
