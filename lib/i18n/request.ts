import { getRequestConfig } from 'next-intl/server';
import type { AbstractIntlMessages } from 'next-intl';
import { DEFAULT_LOCALE, LOCALES, type Locale } from '@/lib/constants';
import enMessages from '@/messages/en.json';

/**
 * Per-request i18n config for next-intl. Resolves the active locale and loads its
 * message catalog. With a single enabled locale this always resolves to English;
 * the structure supports adding catalogs under /messages without code changes.
 *
 * Message catalogs are imported statically (not via a computed dynamic
 * `import()` path) so TypeScript can fully verify their shape — a computed
 * template-literal import path cannot be resolved at compile time and
 * resolves to `any` regardless of any type annotation placed on it.
 */
const messageCatalogs: Record<Locale, AbstractIntlMessages> = {
  en: enMessages,
};

export default getRequestConfig(async ({ locale }) => {
  const resolved: Locale = (LOCALES as readonly string[]).includes(locale ?? '')
    ? (locale as Locale)
    : DEFAULT_LOCALE;

  const messages = messageCatalogs[resolved];

  return { locale: resolved, messages };
});
