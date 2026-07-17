import { handlers } from '@/lib/auth/config';

/**
 * Auth.js route handlers (Stage 5 §7). Exposes the framework's sign-in/out,
 * callback, and session endpoints under /api/auth/*. Our custom credential and
 * 2FA flows run through Server Actions; these handlers back the session machinery.
 */
export const { GET, POST } = handlers;
