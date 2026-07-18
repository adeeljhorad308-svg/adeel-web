import { NextResponse, type NextRequest } from 'next/server';
import { buildContentSecurityPolicy, generateNonce } from '@/lib/security/headers';
import { serverEnv } from '@/lib/config/env';

/**
 * Edge middleware (Stage 5 §7, §10, §19).
 *
 * Responsibilities kept intentionally light so they run at the edge without a DB:
 *   1. Attach a per-request CSP nonce and dynamic Content-Security-Policy.
 *   2. Enforce maintenance mode (503) for the public site, bypassing admin/auth.
 *   3. Gate /admin behind an authenticated session cookie (presence check only;
 *      full RBAC + session validation happens in the admin layout/server side).
 *
 * Deep session verification and role checks are deliberately NOT done here — the
 * edge cannot reach Prisma cheaply, and authorization must be enforced server-side
 * on every action regardless. This is a fast first gate, not the security boundary.
 *
 * NOTE ON THE COOKIE NAME: Auth.js v5 uses `authjs.session-token` (or the
 * `__Secure-` prefixed variant over HTTPS) as the session cookie name for BOTH
 * the JWT and database session strategies — only the cookie's content differs
 * (encrypted JWT vs. opaque token), not its name. This project uses the JWT
 * strategy (see lib/auth/config.ts for why), so this check remains valid after
 * that design decision. If a future Auth.js version changes the cookie name,
 * this check only degrades to "redirect to login unnecessarily" — it never
 * widens access, because `app/admin/layout.tsx` re-verifies the real session
 * server-side regardless.
 */

const SESSION_COOKIE = 'authjs.session-token';
const SECURE_SESSION_COOKIE = '__Secure-authjs.session-token';

function hasSessionCookie(request: NextRequest): boolean {
  return request.cookies.has(SESSION_COOKIE) || request.cookies.has(SECURE_SESSION_COOKIE);
}

export function middleware(request: NextRequest): NextResponse {
  const { pathname } = request.nextUrl;
  const nonce = generateNonce();
  const csp = buildContentSecurityPolicy(nonce);

  // Propagate the nonce to the app via a request header so the root layout can
  // apply it to any inline script tags it renders.
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-nonce', nonce);
  requestHeaders.set('content-security-policy', csp);

  const isAdmin = pathname.startsWith('/admin');
  const isAuthRoute =
    pathname.startsWith('/login') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/verify-email') ||
    pathname.startsWith('/2fa');

  // --- Maintenance mode: public site returns 503; admin + auth remain reachable ---
  if (serverEnv.MAINTENANCE_MODE && !isAdmin && !isAuthRoute) {
    const maintenanceUrl = new URL('/maintenance', request.url);
    const rewritten = NextResponse.rewrite(maintenanceUrl, {
      request: { headers: requestHeaders },
    });
    rewritten.headers.set('Retry-After', '3600');
    rewritten.headers.set('content-security-policy', csp);
    // NextResponse.rewrite() always sets status 200; construct a fresh response
    // carrying the same body/headers but with status 503, rather than spreading
    // the previous response's own enumerable properties (Response/NextResponse
    // expose headers/status via prototype getters, which object spread does not
    // capture reliably).
    return new NextResponse(rewritten.body, {
      status: 503,
      headers: rewritten.headers,
    });
  }

  // --- Admin gate: no session cookie → redirect to login with return path ---
  if (isAdmin && !hasSessionCookie(request)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('callbackUrl', pathname);
    const redirect = NextResponse.redirect(loginUrl);
    redirect.headers.set('content-security-policy', csp);
    return redirect;
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set('content-security-policy', csp);
  return response;
}

export const config = {
  // Run on everything except static assets and image optimization outputs.
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml|.*\\..*).*)'],
};
