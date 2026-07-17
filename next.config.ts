import type { NextConfig } from 'next';
import createNextIntlPlugin from 'next-intl/plugin';

const withNextIntl = createNextIntlPlugin('./lib/i18n/request.ts');

/**
 * Next.js configuration for the Adeel IT Solutions platform.
 *
 * Security headers here are the static, app-wide baseline. The dynamic,
 * per-request Content-Security-Policy (with nonce) is applied in middleware.ts
 * so it can vary safely per response. Keeping the two concerns separate avoids
 * a static CSP that would otherwise force `unsafe-inline`.
 */
const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Produce a standalone server bundle for efficient container/serverless deploys.
  output: 'standalone',

  // OpenTelemetry and other Node instrumentation load via instrumentation.ts,
  // which is a stable (non-experimental) feature as of Next.js 15 — no config
  // flag is needed or accepted; instrumentation.ts is picked up automatically.
  experimental: {
    // Server Actions are used throughout the admin surface (Stage 5).
    serverActions: {
      bodySizeLimit: '2mb',
    },
    optimizePackageImports: ['lucide-react'],
  },

  images: {
    // Cloudinary is the only remote image source (Stage 5 §9).
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
    ],
    formats: ['image/avif', 'image/webp'],
  },

  // Fail the production build on type or lint errors — no silent escapes.
  typescript: {
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },

  // @opentelemetry/sdk-node lazily requires several exporter packages
  // (Jaeger, Zipkin, etc.) as OPTIONAL peer dependencies it conditionally
  // supports — we only use @opentelemetry/exporter-trace-otlp-http. Webpack's
  // static analysis doesn't know these requires are optional and fails the
  // build when a package isn't installed. This is OpenTelemetry's own
  // documented guidance for bundling sdk-node: mark the unused optional
  // exporters as server-external so webpack skips trying to resolve them.
  serverExternalPackages: [
    '@opentelemetry/sdk-node',
    '@opentelemetry/exporter-trace-otlp-http',
    '@opentelemetry/resources',
    '@opentelemetry/semantic-conventions',
  ],

  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()',
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload',
          },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
