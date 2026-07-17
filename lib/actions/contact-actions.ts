'use server';

import {
  submitContactForm as _submitContactForm,
  listContactRequests as _listContactRequests,
  updateContactRequest as _updateContactRequest,
  deleteContactRequest as _deleteContactRequest,
  addContactNote as _addContactNote,
  exportContactRequestsCsv as _exportContactRequestsCsv,
} from '@/lib/services/contact-service';
import type { ContactListInput } from '@/lib/validation/contact';

/** Server Action boundary for the Contact system (see blog-actions.ts for rationale). */
export async function submitContactForm(input: unknown) {
  return _submitContactForm(input);
}

export async function listContactRequests(input: ContactListInput) {
  return _listContactRequests(input);
}

export async function updateContactRequest(input: unknown) {
  return _updateContactRequest(input);
}

export async function deleteContactRequest(id: string) {
  return _deleteContactRequest(id);
}

export async function addContactNote(input: unknown) {
  return _addContactNote(input);
}

export async function exportContactRequestsCsv(input: ContactListInput) {
  return _exportContactRequestsCsv(input);
}
