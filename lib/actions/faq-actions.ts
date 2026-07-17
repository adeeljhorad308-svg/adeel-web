'use server';

import {
  listFaqs as _listFaqs,
  upsertFaq as _upsertFaq,
  deleteFaq as _deleteFaq,
} from '@/lib/services/faq-service';

/** Server Action boundary for the FAQ module (see blog-actions.ts for rationale). */
export async function listFaqs() {
  return _listFaqs();
}

export async function upsertFaq(input: unknown) {
  return _upsertFaq(input);
}

export async function deleteFaq(id: string) {
  return _deleteFaq(id);
}
