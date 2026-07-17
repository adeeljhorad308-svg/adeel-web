'use server';

import {
  listServices as _listServices,
  getService as _getService,
  upsertService as _upsertService,
  deleteService as _deleteService,
  reorderServices as _reorderServices,
} from '@/lib/services/services-service';
import type { ServiceListInput } from '@/lib/validation/services';

/**
 * Server Action boundary for the Services module (Stage 5 §3, §5).
 *
 * The domain logic lives in `lib/services/services-service.ts`, which is a plain
 * `server-only` module (not itself directly callable from Client Components).
 * Next.js requires every export from a `'use server'` file to itself be an
 * async function declaration, so each action here is its own thin async
 * wrapper forwarding to the corresponding service function — this preserves
 * the domain module's ability to be imported by other server code (route
 * handlers, jobs) without forcing the Server Action wire format on every caller.
 */
export async function listServices(input: ServiceListInput) {
  return _listServices(input);
}

export async function getService(id: string) {
  return _getService(id);
}

export async function upsertService(input: unknown) {
  return _upsertService(input);
}

export async function deleteService(id: string) {
  return _deleteService(id);
}

export async function reorderServices(input: unknown) {
  return _reorderServices(input);
}
