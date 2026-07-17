import type { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk, JetBrains_Mono } from 'next/font/google';
import { AppProviders } from '@/components/providers';
import { CookieConsent } from '@/components/public/cookie-consent';
import { getAnalyticsSettingsPublic } from '@/lib/services/public-content-service';
import { APP_NAME } from '@/lib/constants';
import { clientEnv } from '@/lib/config/env';
import { cn } from '@/lib/utils';
import './globals.css';

/**
 * Root layout. Establishes the font variables (Stage 1 typography: Space Grotesk
 * display, Inter body/UI, JetBrains Mono code), wires the provider stack, applies
 * a no-flash theme script, and renders the skip-to-content link required for
 * WCAG 2.2 AA. Fonts are self-hosted via next/font (Stage 5 §11 performance).
 */

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-space-grotesk',
  display: 'swap',
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(clientEnv.NEXT_PUBLIC_APP_URL),
  title: {
    default: `${APP_NAME} — Premium Software Development`,
    template: `%s — ${APP_NAME}`,
  },
  description:
    'Adeel IT Solutions builds premium web, software, and AI solutions for businesses in the US, UK, and Pakistan.',
  applicationName: APP_NAME,
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#f8fafc' },
    { media: '(prefers-color-scheme: dark)', color: '#020617' },
  ],
  width: 'device-width',
  initialScale: 1,
};

// Inline, render-blocking theme resolver: sets .dark before first paint to avoid
// a flash of incorrect theme. Kept tiny and dependency-free.
const themeScript = `
(function() {
  try {
    var stored = localStorage.getItem('theme-mode');
    var mode = stored || 'system';
    var dark = mode === 'dark' || (mode === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    if (dark) document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}): Promise<React.ReactElement> {
  const analyticsIds = await getAnalyticsSettingsPublic();

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body
        className={cn(
          inter.variable,
          spaceGrotesk.variable,
          jetbrainsMono.variable,
          'font-sans antialiased',
        )}
      >
        <a href="#main-content" className="skip-link">
          Skip to content
        </a>
        <AppProviders>{children}</AppProviders>
        <CookieConsent analyticsIds={analyticsIds} />
      </body>
    </html>
  );
}
