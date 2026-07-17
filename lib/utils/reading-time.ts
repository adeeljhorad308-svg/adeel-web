/**
 * Reading time estimation (Stage 4 §7; Master Spec: reading time). Strips HTML
 * tags before counting words, then divides by an average adult reading speed.
 * Pure function so it can be tested and reused between the admin editor preview
 * and the server-side auto-compute on save.
 */
const WORDS_PER_MINUTE = 200;

export function estimateReadingTime(html: string): number {
  const text = html.replace(/<[^>]*>/g, ' ');
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / WORDS_PER_MINUTE));
}
