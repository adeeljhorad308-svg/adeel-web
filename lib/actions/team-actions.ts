'use server';

import {
  listTeamMembers as _listTeamMembers,
  getTeamMember as _getTeamMember,
  upsertTeamMember as _upsertTeamMember,
  deleteTeamMember as _deleteTeamMember,
} from '@/lib/services/team-service';
import type { TeamListInput } from '@/lib/validation/team';

/** Server Action boundary for the Team Management module (see blog-actions.ts for rationale). */
export async function listTeamMembers(input: TeamListInput) {
  return _listTeamMembers(input);
}

export async function getTeamMember(id: string) {
  return _getTeamMember(id);
}

export async function upsertTeamMember(input: unknown) {
  return _upsertTeamMember(input);
}

export async function deleteTeamMember(id: string) {
  return _deleteTeamMember(id);
}
