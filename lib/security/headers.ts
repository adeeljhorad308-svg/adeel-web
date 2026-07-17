import 'server-only';

/**
 * Content-Security-Policy construction (Stage 5 §10; OWASP: XSS, clickjacking).
 *
 * The CSP is built per-request in middleware with a fresh nonce so inline scripts
 * Next.js injects can be allowlisted without `unsafe-inline`. Static headers
 * (HSTS, X-Frame-Options, nosniff, Referrer-Policy, Permissions-Policy) live in
 * next.config.ts; the dynamic, nonce-bearing CSP lives here.
 */

/** Generate a base64 nonce suitable for CSP `script-src 'nonce-…'`. */
export function generateNonce(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes));
}

/**
 * Build the CSP header value. Cloudinary is the only remote media origin; Upstash
 * and OTLP are reached server-side (not from the browser) so they are not listed
 * under connect-src beyond self. Adjust connect-src if client analytics are later
 * enabled behind consent.
 */
export function buildContentSecurityPolicy(nonce: string): string {
  const directives: Record<string, string[]> = {
    'default-src': ["'self'"],
    'script-src': ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"],
    'style-src': ["'self'", "'unsafe-inline'"], // Tailwind injects hashed styles; inline needed for critical CSS.
    'img-src': ["'self'", 'data:', 'blob:', 'https://res.cloudinary.com'],
    'font-src': ["'self'", 'data:'],
    'connect-src': ["'self'"],
    'media-src': ["'self'", 'https://res.cloudinary.com'],
    'frame-src': ["'self'", 'https://www.google.com'], // Google Maps embed on contact page.
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': [],
  };

  return Object.entries(directives)
    .map(([key, values]) => (values.length > 0 ? `${key} ${values.join(' ')}` : key))
    .join('; ');
}
