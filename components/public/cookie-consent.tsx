'use client';

import { useEffect, useState } from 'react';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { loadAnalytics } from '@/lib/services/analytics-client';

const STORAGE_KEY = 'cookie-consent';

const consentStateSchema = z.object({
  functional: z.boolean(),
  analytics: z.boolean(),
  marketing: z.boolean(),
});

type ConsentState = z.infer<typeof consentStateSchema>;

/**
 * Cookie consent banner (Stage 3 legal system; Stage 5 analytics gating).
 * Analytics scripts load only after explicit "Accept" or "Accept analytics" —
 * never on page load unconditionally. Preferences persist in localStorage and
 * can be re-opened from the Cookie Policy page.
 */
export function CookieConsent({
  analyticsIds,
}: {
  analyticsIds: { gaId?: string | undefined; gtmId?: string | undefined };
}): React.ReactElement | null {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      setVisible(true);
      return;
    }
    const parsed: unknown = JSON.parse(stored);
    const result = consentStateSchema.safeParse(parsed);
    if (!result.success) {
      setVisible(true);
      return;
    }
    if (result.data.analytics) loadAnalytics(analyticsIds);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function accept(consent: ConsentState): void {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(consent));
    if (consent.analytics) loadAnalytics(analyticsIds);
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed inset-x-0 bottom-0 z-toast border-t border-[color:var(--color-border-default)] bg-[color:var(--color-bg-surface)] p-4 shadow-lg"
    >
      <div className="mx-auto flex max-w-content-xl flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-small text-[color:var(--color-text-body)]">
          We use cookies to improve your experience and understand site usage. See our{' '}
          <a
            href="/legal/cookies"
            className="text-[color:var(--color-brand-primary)] hover:underline"
          >
            Cookie Policy
          </a>
          .
        </p>
        <div className="flex shrink-0 gap-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={() => accept({ functional: true, analytics: false, marketing: false })}
          >
            Essential only
          </Button>
          <Button
            size="sm"
            onClick={() => accept({ functional: true, analytics: true, marketing: true })}
          >
            Accept all
          </Button>
        </div>
      </div>
    </div>
  );
}
