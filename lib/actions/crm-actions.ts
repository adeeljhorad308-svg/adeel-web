'use server';

import {
  listLeads as _listLeads,
  upsertLead as _upsertLead,
  moveLeadStage as _moveLeadStage,
  deleteLead as _deleteLead,
  addLeadNote as _addLeadNote,
  convertContactToLead as _convertContactToLead,
} from '@/lib/services/crm-service';
import type { LeadListInput } from '@/lib/validation/crm';

/** Server Action boundary for the CRM module (see blog-actions.ts for rationale). */
export async function listLeads(input: LeadListInput) {
  return _listLeads(input);
}

export async function upsertLead(input: unknown) {
  return _upsertLead(input);
}

export async function moveLeadStage(input: unknown) {
  return _moveLeadStage(input);
}

export async function deleteLead(id: string) {
  return _deleteLead(id);
}

export async function addLeadNote(leadId: string, body: string) {
  return _addLeadNote(leadId, body);
}

export async function convertContactToLead(contactId: string) {
  return _convertContactToLead(contactId);
}
