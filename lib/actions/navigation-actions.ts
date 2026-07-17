'use server';

import {
  saveNavigationMenu as _saveNavigationMenu,
  getNavigationMenu as _getNavigationMenu,
} from '@/lib/services/navigation-service';

/** Server Action boundary for the Navigation Builder module (see blog-actions.ts for rationale). */
export async function saveNavigationMenu(input: unknown) {
  return _saveNavigationMenu(input);
}

export async function getNavigationMenu(context: 'HEADER' | 'FOOTER', name: string) {
  return _getNavigationMenu(context, name);
}
