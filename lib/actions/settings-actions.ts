'use server';

import {
  getCompanySettings as _getCompanySettings,
  updateCompanySettings as _updateCompanySettings,
  getSocialLinks as _getSocialLinks,
  updateSocialLinks as _updateSocialLinks,
  getAnalyticsSettings as _getAnalyticsSettings,
  updateAnalyticsSettings as _updateAnalyticsSettings,
} from '@/lib/services/settings-service';

/** Server Action boundary for the Settings module (see blog-actions.ts for rationale). */
export async function getCompanySettings() {
  return _getCompanySettings();
}

export async function updateCompanySettings(input: unknown) {
  return _updateCompanySettings(input);
}

export async function getSocialLinks() {
  return _getSocialLinks();
}

export async function updateSocialLinks(input: unknown) {
  return _updateSocialLinks(input);
}

export async function getAnalyticsSettings() {
  return _getAnalyticsSettings();
}

export async function updateAnalyticsSettings(input: unknown) {
  return _updateAnalyticsSettings(input);
}
