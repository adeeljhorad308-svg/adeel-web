import 'server-only';
import { toErrorEnvelope } from '@/lib/errors';
import type { ActionResult } from '@/lib/types';

/**
 * Shared error-to-ActionResult mapper (Stage 5 §3, §22). Every Server Action in
 * every service module funnels its catch block through this so the error
 * envelope is identical everywhere, with no per-module reimplementation to drift.
 */
export function toActionError(error: unknown): ActionResult<never> {
  const { body } = toErrorEnvelope(error);
  return { ok: false, error: body.error };
}
