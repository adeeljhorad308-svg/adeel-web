import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages } from 'next-intl/server';
import { ThemeProvider } from './theme-provider';

/**
 * Application provider composition. Server Component wrapper that resolves the
 * locale and messages, then hands off to client providers (i18n, theme). Keeping
 * this composition in one place means the root layout stays declarative.
 */
export async function AppProviders({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const locale = await getLocale();
  const messages = await getMessages();

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <ThemeProvider>{children}</ThemeProvider>
    </NextIntlClientProvider>
  );
}
