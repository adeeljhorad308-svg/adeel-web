'use client';

import { useEffect, useState } from 'react';

/**
 * Client-only date formatting (build-readiness fix: hydration mismatch).
 *
 * `toLocaleString()`/`toLocaleDateString()` depend on the runtime's locale and
 * timezone. When called during SSR, the server's environment can differ from
 * the browser's, producing a string that mismatches what the client renders on
 * hydration — React then throws a hydration-mismatch warning (or in some cases
 * a visible flash of different content).
 *
 * This component renders nothing on the server and fills in the formatted date
 * only after mount, once we're guaranteed to be in the browser's own locale
 * and timezone. The `placeholder` is shown during SSR and the brief pre-mount
 * window so layout doesn't shift.
 */
export function ClientFormattedDate({
  date,
  format = 'datetime',
  placeholder = '—',
}: {
  date: Date | string;
  format?: 'datetime' | 'date';
  placeholder?: string;
}): React.ReactElement {
  const [formatted, setFormatted] = useState<string | null>(null);

  useEffect(() => {
    const d = typeof date === 'string' ? new Date(date) : date;
    setFormatted(format === 'date' ? d.toLocaleDateString() : d.toLocaleString());
  }, [date, format]);

  return <>{formatted ?? placeholder}</>;
}
