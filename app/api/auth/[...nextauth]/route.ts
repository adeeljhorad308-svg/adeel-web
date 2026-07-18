import { handlers } from '@/lib/auth/config';

/**
 * Auth.js route handlers (Stage 5 §7).
 * Force dynamic rendering to avoid build-time execution issues
 * with environment validation and Prisma.
 */
export const dynamic = 'force-dynamic';

export const { GET, POST } = handlers;
