/**
 * Error-handling foundation (Stage 5 §3, §22).
 *
 * Domain code throws typed `AppError`s. The API boundary converts them into the
 * safe response envelope — never leaking stack traces or internal detail to the
 * client (OWASP: sensitive data exposure). Unknown errors collapse to a generic
 * 500 with a stable code while the full error is logged server-side.
 */

export type ErrorCode =
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'RATE_LIMITED'
  | 'CONFLICT'
  | 'SERVER_ERROR';

const STATUS_BY_CODE: Record<ErrorCode, number> = {
  UNAUTHENTICATED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  VALIDATION_ERROR: 422,
  RATE_LIMITED: 429,
  CONFLICT: 409,
  SERVER_ERROR: 500,
};

export interface FieldErrors {
  readonly [field: string]: string;
}

/** Base class for all expected, handled application errors. */
export class AppError extends Error {
  readonly code: ErrorCode;
  readonly httpStatus: number;
  readonly fields: FieldErrors | undefined;
  /** Safe to expose to the client. Internal detail stays in `cause`/logs. */
  readonly expose: boolean;

  constructor(
    code: ErrorCode,
    message: string,
    options?: { fields?: FieldErrors; cause?: unknown; expose?: boolean },
  ) {
    super(message, options?.cause !== undefined ? { cause: options.cause } : undefined);
    this.name = new.target.name;
    this.code = code;
    this.httpStatus = STATUS_BY_CODE[code];
    this.fields = options?.fields;
    this.expose = options?.expose ?? true;
    Error.captureStackTrace?.(this, new.target);
  }
}

export class UnauthenticatedError extends AppError {
  constructor(message = 'You need to sign in to continue.') {
    super('UNAUTHENTICATED', message);
  }
}

export class ForbiddenError extends AppError {
  constructor(message = 'You do not have permission to perform this action.') {
    super('FORBIDDEN', message);
  }
}

export class NotFoundError extends AppError {
  constructor(message = 'The requested resource was not found.') {
    super('NOT_FOUND', message);
  }
}

export class ValidationError extends AppError {
  constructor(message = 'Some fields need your attention.', fields?: FieldErrors) {
    super('VALIDATION_ERROR', message, fields !== undefined ? { fields } : undefined);
  }
}

export class RateLimitError extends AppError {
  constructor(message = 'Too many requests. Please try again shortly.') {
    super('RATE_LIMITED', message);
  }
}

/** Raised when an optimistic-concurrency version check fails (Stage 5 improvement). */
export class ConflictError extends AppError {
  constructor(message = 'This item was changed by someone else. Reload and try again.') {
    super('CONFLICT', message);
  }
}

// --- Response envelope (Stage 5 §3) ---

export interface SuccessEnvelope<T> {
  readonly ok: true;
  readonly data: T;
  readonly meta?: Record<string, unknown>;
}

export interface ErrorEnvelope {
  readonly ok: false;
  readonly error: {
    readonly code: ErrorCode;
    readonly message: string;
    readonly fields?: FieldErrors;
  };
}

export type ResponseEnvelope<T> = SuccessEnvelope<T> | ErrorEnvelope;

export function success<T>(data: T, meta?: Record<string, unknown>): SuccessEnvelope<T> {
  return meta !== undefined ? { ok: true, data, meta } : { ok: true, data };
}

/**
 * Normalize any thrown value into a safe error envelope + HTTP status.
 * The caller is responsible for logging the original error with context.
 */
export function toErrorEnvelope(error: unknown): { body: ErrorEnvelope; status: number } {
  if (error instanceof AppError) {
    return {
      status: error.httpStatus,
      body: {
        ok: false,
        error: {
          code: error.code,
          message: error.expose ? error.message : 'Something went wrong. Please try again.',
          ...(error.fields !== undefined ? { fields: error.fields } : {}),
        },
      },
    };
  }
  return {
    status: 500,
    body: {
      ok: false,
      error: {
        code: 'SERVER_ERROR',
        message: 'Something went wrong on our end. Please try again.',
      },
    },
  };
}
