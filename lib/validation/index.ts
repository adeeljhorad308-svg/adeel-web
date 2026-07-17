import { z } from 'zod';
import { ValidationError, type FieldErrors } from '@/lib/errors';

/**
 * Validation infrastructure (Stage 5 §3, §5). Shared Zod primitives keep field
 * rules consistent across every form and endpoint, and `parseOrThrow` converts
 * Zod failures into the platform's typed ValidationError with per-field messages.
 */

export const zEmail = z.string().trim().toLowerCase().email('Enter a valid email address.');

export const zNonEmpty = (label: string): z.ZodString =>
  z.string().trim().min(1, `${label} is required.`);

export const zSlug = z
  .string()
  .trim()
  .min(1, 'Slug is required.')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers, and hyphens only.');

export const zUrl = z.string().trim().url('Enter a valid URL.');

export const zOptionalUrl = z
  .union([zUrl, z.literal('')])
  .transform((value) => (value === '' ? undefined : value))
  .optional();

/** Optimistic-concurrency guard: the version the client last saw (Stage 5 improvement). */
export const zVersion = z.number().int().nonnegative();

/** Pagination query shared by list endpoints. */
export const zPagination = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
});

/** Flatten a ZodError into `{ field: message }` for the response envelope. */
export function toFieldErrors(error: z.ZodError): FieldErrors {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join('.');
    if (path && fields[path] === undefined) {
      fields[path] = issue.message;
    }
  }
  return fields;
}

/** Parse input against a schema, throwing a typed ValidationError on failure. */
export function parseOrThrow<T extends z.ZodTypeAny>(schema: T, input: unknown): z.infer<T> {
  try {
    const parse: (data: unknown) => z.infer<T> = schema.parse.bind(schema);
    return parse(input);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError('Some fields need your attention.', toFieldErrors(error));
    }
    throw error;
  }
}
