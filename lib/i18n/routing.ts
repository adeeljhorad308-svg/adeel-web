import { LOCALES, DEFAULT_LOCALE } from '@/lib/constants';

/**
 * i18n routing configuration (Stage 5 improvement: multilingual-ready).
 *
 * English is the only enabled locale initially, but the architecture is in place
 * so additional locales can be turned on without structural change. Locale is not
 * yet reflected in the URL path (single-locale mode); when a second locale is
 * enabled, switch `localePrefix` to 'always' and add locale segments.
 */
export const routing = {
  locales: LOCALES,
  defaultLocale: DEFAULT_LOCALE,
  localePrefix: 'as-needed' as const,
};
