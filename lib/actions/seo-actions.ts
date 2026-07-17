'use server';

import {
  getGlobalSeoConfig as _getGlobalSeoConfig,
  saveGlobalSeoConfig as _saveGlobalSeoConfig,
  listSeoOverrides as _listSeoOverrides,
  saveSeoOverride as _saveSeoOverride,
  deleteSeoOverride as _deleteSeoOverride,
} from '@/lib/services/seo-service';

/** Server Action boundary for the SEO Manager module (see blog-actions.ts for rationale). */
export async function getGlobalSeoConfig() {
  return _getGlobalSeoConfig();
}

export async function saveGlobalSeoConfig(input: unknown) {
  return _saveGlobalSeoConfig(input);
}

export async function listSeoOverrides() {
  return _listSeoOverrides();
}

export async function saveSeoOverride(input: unknown) {
  return _saveSeoOverride(input);
}

export async function deleteSeoOverride(pagePath: string) {
  return _deleteSeoOverride(pagePath);
}
