import 'server-only';
import { randomUUID } from 'node:crypto';
import NextAuth, { type NextAuthConfig, type Session } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/db/prisma';
import { verifyPassword } from '@/lib/auth/password';
import { loginSchema } from '@/lib/validation/auth';
import type { Role, UserStatus } from '@/lib/constants';

/**
 * Auth.js configuration (Stage 5 §7).
 *
 * BUILD-READINESS FIX: Auth.js does not support the Credentials provider with
 * the `database` session strategy — Credentials has no OAuth account for the
 * adapter to persist against, so Auth.js always falls back to JWT sessions for
 * Credentials regardless of the configured strategy. The original design (plain
 * `strategy: 'database'` + Credentials) would silently not behave as intended.
 *
 * Fix: use the JWT strategy (required for Credentials), but back it with our
 * own `Session` table for server-side revocation — the JWT carries only an
 * opaque `sessionId`; every request's `session` callback looks that id up in
 * our `Session` table and rejects the session if it's missing (revoked) or
 * expired. This preserves "logout all devices" (delete rows keyed by user) and
 * per-session revocation, without fighting Auth.js's Credentials constraint.
 * No `@auth/prisma-adapter` is used, since the adapter is for OAuth account
 * persistence, which this credentials-only setup doesn't need.
 */

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

const providers: NextAuthConfig['providers'] = [
  Credentials({
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Password', type: 'password' },
    },
    async authorize(rawCredentials) {
      const parsed = loginSchema.safeParse(rawCredentials);
      if (!parsed.success) return null;

      const { email, password } = parsed.data;
      const user = await prisma.user.findUnique({ where: { email } });

      // Uniform failure for unknown user, no password set, or suspended account —
      // avoids leaking which condition failed (OWASP: user enumeration).
      if (!user?.passwordHash || user.status === 'SUSPENDED') {
        return null;
      }

      const valid = await verifyPassword(user.passwordHash, password);
      if (!valid) return null;

      // Create our own durable Session row now, at the moment of authorization.
      // Its id is embedded in the JWT below (via the jwt callback) so later
      // requests can look it up for revocation checks.
      const dbSession = await prisma.session.create({
        data: {
          sessionToken: randomUUID(),
          userId: user.id,
          expires: new Date(Date.now() + SESSION_MAX_AGE_SECONDS * 1000),
        },
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        // Passed through to the jwt callback via the `user` param on first sign-in.
        dbSessionId: dbSession.id,
      };
    },
  }),
];

export const authConfig = {
  session: { strategy: 'jwt', maxAge: SESSION_MAX_AGE_SECONDS },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  providers,
  callbacks: {
    /**
     * On initial sign-in, `user` is the object `authorize()` returned — stash
     * our DB session id and role onto the token. On subsequent requests `user`
     * is undefined and the token is passed through as-is (mutated only by
     * `session` below when a revocation is detected).
     */
    async jwt({ token, user }) {
      if (user) {
    if (typeof user.id === "string") {
        token.sub = user.id;
    }

    if (typeof user.dbSessionId === "string") {
        token.dbSessionId = user.dbSessionId;
    }
}
      return token;
    },
    /**
     * Look up the DB-backed session on every request. If it's missing (revoked
     * via logout-all-devices or expired and swept), invalidate the session by
     * returning an empty session object — `getCurrentUser()` treats a missing
     * `session.user.id` as unauthenticated.
     */
    async session({ session, token }): Promise<Session> {
      const dbSessionId =
  typeof token.dbSessionId === "string"
    ? token.dbSessionId
    : undefined;
      if (typeof dbSessionId !== 'string') {
        return { ...session, user: undefined as unknown as Session['user'], expires: session.expires };
      }

      const sessionId = dbSessionId;
      const dbSession = await prisma.session.findUnique({ where: { id: sessionId } });
      if (!dbSession || dbSession.expires < new Date()) {
        return { ...session, user: undefined as unknown as Session['user'], expires: session.expires };
      }

      const dbUser = await prisma.user.findUnique({
        where: { id: dbSession.userId },
        select: { id: true, email: true, name: true, role: true, status: true },
      });
      if (!dbUser || dbUser.status === 'SUSPENDED') {
        return { ...session, user: undefined as unknown as Session['user'], expires: session.expires };
      }

      session.user.id = dbUser.id;
      session.user.email = dbUser.email;
      session.user.name = dbUser.name;
      session.user.role = dbUser.role as Role;
      session.user.status = dbUser.status as UserStatus;
      session.dbSessionId = sessionId;
      return session;
    },
  },
  trustHost: true,
} satisfies NextAuthConfig;

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
