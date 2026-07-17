'use server';

import {
  listTestimonials as _listTestimonials,
  getTestimonial as _getTestimonial,
  upsertTestimonial as _upsertTestimonial,
  deleteTestimonial as _deleteTestimonial,
} from '@/lib/services/testimonials-service';
import type { TestimonialListInput } from '@/lib/validation/testimonials';

/** Server Action boundary for the Testimonials module (see blog-actions.ts for rationale). */
export async function listTestimonials(input: TestimonialListInput) {
  return _listTestimonials(input);
}

export async function getTestimonial(id: string) {
  return _getTestimonial(id);
}

export async function upsertTestimonial(input: unknown) {
  return _upsertTestimonial(input);
}

export async function deleteTestimonial(id: string) {
  return _deleteTestimonial(id);
}
