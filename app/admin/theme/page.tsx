import type { Metadata } from 'next';
import { requirePermissionOrRedirect } from '@/lib/auth/guards';
import { getThemeConfig } from '@/lib/actions/theme-actions';
import { defaultThemeTokens } from '@/lib/services/theme-service';
import { PageHeader } from '@/components/admin/page-primitives';
import { ThemeManagerClient } from '@/components/admin/theme-manager-client';

export const metadata: Metadata = { title: 'Theme Manager', robots: { index: false, follow: false } };

/**
 * Theme Manager page (Stage 4 §11). Falls back to the Stage 1 default tokens
 * when no ThemeConfig row exists yet (first run), so the editor always opens
 * with a valid, AA-compliant starting palette rather than a blank form.
 */
export default async function AdminThemePage(): Promise<React.ReactElement> {
  await requirePermissionOrRedirect('THEME', 'VIEW', '/admin/theme');

  const result = await getThemeConfig();
  const defaults = defaultThemeTokens();
  const initial =
    result.ok && result.data
      ? {
          light: result.data.tokensLight as Record<string, string>,
          dark: result.data.tokensDark as Record<string, string>,
        }
      : defaults;

  return (
    <>
      <PageHeader title="Theme Manager" description="Edit brand colors for light and dark mode. Changes apply site-wide without a deploy." />
      <ThemeManagerClient initial={initial} />
    </>
  );
}
