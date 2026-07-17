/**
 * Shared cross-layer types. Domain-specific types live with their modules;
 * only genuinely shared shapes belong here to avoid a dumping-ground module.
 */
import type { Action, Module, Role } from '@/lib/constants';

/** Result of a Server Action, mirroring the API envelope for consistent client handling. */
export type ActionResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: { code: string; message: string; fields?: Record<string, string> } };

/** The authenticated principal resolved from the session for authorization checks. */
export interface AuthenticatedUser {
  readonly id: string;
  readonly email: string;
  readonly name: string | null;
  readonly role: Role;
}

/** A single permission grant in the RBAC matrix. */
export interface Permission {
  readonly module: Module;
  readonly action: Action;
}

/** Cursor/offset pagination parameters accepted by list endpoints. */
export interface PaginationParams {
  readonly page: number;
  readonly pageSize: number;
  readonly sort?: string;
  readonly order?: 'asc' | 'desc';
}

/** Standard paginated payload returned by list services. */
export interface Paginated<T> {
  readonly items: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
}

/** Utility: make selected keys required. */
export type WithRequired<T, K extends keyof T> = T & { [P in K]-?: T[P] };
