'use server';

import {
  getFooterConfig as _getFooterConfig,
  saveFooterConfig as _saveFooterConfig,
} from '@/lib/services/footer-service';

/** Server Action boundary for the Footer Builder module (see blog-actions.ts for rationale). */
export async function getFooterConfig() {
  return _getFooterConfig();
}

export async function saveFooterConfig(input: unknown) {
  return _saveFooterConfig(input);
}
