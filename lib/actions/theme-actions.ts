'use server';

import {
  getThemeConfig as _getThemeConfig,
  saveThemeConfig as _saveThemeConfig,
} from '@/lib/services/theme-service';

/** Server Action boundary for the Theme Manager module (see blog-actions.ts for rationale). */
export async function getThemeConfig() {
  return _getThemeConfig();
}

export async function saveThemeConfig(input: unknown) {
  return _saveThemeConfig(input);
}
