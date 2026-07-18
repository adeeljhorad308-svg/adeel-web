import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, setRequestLocale } from 'next-intl/server';
import { DEFAULT_LOCALE } from '@/lib/constants';
import { ThemeProvider } from './theme-provider';

/**
 * Application provider composition. Server Component wrapper that resolves the
 * locale and messages, then hands off to client providers (i18n, theme). Keeping
 * this composition in one place means the root layout stays declarative.
 *
 * This app has a single fixed locale (no `[locale]` route segment/middleware).
 * Without `setRequestLocale`, next-intl falls back to request-scoped APIs
 * (`headers()`) to detect the locale, which opts every page into dynamic
 * rendering and breaks static prerendering of routes like /401 and /_not-found.
 * Declaring the known locale up front lets next-intl (and Next.js) render
 * these pages statically.
 */
export async function AppProviders({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  setRequestLocale(DEFAULT_LOCALE);
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ThemeProvider>{children}</ThemeProvider>
    </NextIntlClientProvider>
  );
}
