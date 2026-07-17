/**
 * Deterministic, URL-safe slug generation for CMS content. Kept dependency-free
 * and Unicode-aware enough for the platform's initial (English) content while the
 * i18n architecture matures.
 */
export function slugify(input: string): string {
  return input
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}
