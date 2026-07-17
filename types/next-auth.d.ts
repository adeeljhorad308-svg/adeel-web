import type { Role, UserStatus } from '@/lib/constants';
import type { DefaultSession } from 'next-auth';

/**
 * Module augmentation so the authenticated session carries our RBAC fields and
 * the DB-backed session pointer used for server-side revocation (Stage 5 §7;
 * build-readiness fix — see lib/auth/config.ts for why sessions are JWT-backed
 * with a custom Session table rather than the adapter's database strategy).
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: Role;
      status: UserStatus;
    } & DefaultSession['user'];
    /** Our own Session table row id, embedded for revocation checks. Absent
     *  when the session has been revoked/expired (session callback nulls the user). */
    dbSessionId?: string;
  }

  interface User {
    dbSessionId?: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    dbSessionId?: string;
  }
}
