'use server';

import {
  listProjects as _listProjects,
  getProject as _getProject,
  upsertProject as _upsertProject,
  deleteProject as _deleteProject,
  reorderProjects as _reorderProjects,
} from '@/lib/services/portfolio-service';
import type { ProjectListInput } from '@/lib/validation/portfolio';

/** Server Action boundary for the Portfolio Manager module (see blog-actions.ts for rationale). */
export async function listProjects(input: ProjectListInput) {
  return _listProjects(input);
}

export async function getProject(id: string) {
  return _getProject(id);
}

export async function upsertProject(input: unknown) {
  return _upsertProject(input);
}

export async function deleteProject(id: string) {
  return _deleteProject(id);
}

export async function reorderProjects(input: unknown) {
  return _reorderProjects(input);
}
