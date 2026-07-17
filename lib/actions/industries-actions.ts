'use server';

import {
  listIndustries as _listIndustries,
  getIndustry as _getIndustry,
  upsertIndustry as _upsertIndustry,
  deleteIndustry as _deleteIndustry,
} from '@/lib/services/industries-service';
import type { IndustryListInput } from '@/lib/validation/industries';

/** Server Action boundary for the Industries module (see blog-actions.ts for rationale). */
export async function listIndustries(input: IndustryListInput) {
  return _listIndustries(input);
}

export async function getIndustry(id: string) {
  return _getIndustry(id);
}

export async function upsertIndustry(input: unknown) {
  return _upsertIndustry(input);
}

export async function deleteIndustry(id: string) {
  return _deleteIndustry(id);
}
