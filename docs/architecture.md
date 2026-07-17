# Architecture Overview

This platform is a **modular monolith** on Next.js 15 (Stage 5). Layers depend
downward only: Presentation (RSC/client) → Application (server actions + route
handlers) → Domain (`lib/services`) → Data (Prisma/Postgres).

## Layering

- **Presentation** — `app/` routes and `components/`. Server Components fetch data
  and render; client islands (`"use client"`) handle interaction at the leaves.
- **Application** — Server Actions (admin mutations) and Route Handlers
  (`app/api/v1/*` for public/external + webhooks). Every entry point runs
  validation (Zod) and, for admin, authorization before touching the domain.
- **Domain** — `lib/services/*`, pure business logic, transaction orchestration.
- **Data** — Prisma client singleton (`lib/db/prisma.ts`) against Neon Postgres.

## Cross-cutting foundations (Phase 0)

- **Design tokens** (`tokens/`) — three-tier system feeding Tailwind, CSS
  variables, and the future Theme Manager. Components never use raw values.
- **Env validation** (`lib/config/env.ts`) — fail-fast, typed, server/public split.
- **Errors** (`lib/errors/`) — typed domain errors → safe response envelope; no
  stack traces leak to clients.
- **Security** (`lib/security/`) — CSP + nonce, sanitization, rate limiting.
- **Logging** (`lib/logging/`) — structured app logger + durable activity/audit log.
- **RBAC** (`lib/auth/permissions.ts`) — default matrix + DB overrides, enforced
  server-side.
- **Feature flags** (`lib/feature-flags/`) — toggle future modules without deploy.
- **Jobs** (`trigger/`) — async work (email, notifications, scheduled publish,
  backups, exports, image optimization).
- **Telemetry** (`lib/telemetry/`, `instrumentation.ts`) — OpenTelemetry tracing.

## Concurrency & consistency

- **Prisma transactions** wrap any multi-write operation.
- **Optimistic version locking** (a `version` field + `ConflictError`) prevents two
  admins from silently overwriting each other; the client sends the version it saw.
- **Distributed locks** (Upstash) guard cross-instance critical sections (e.g. the
  scheduled-publish sweep).

## Content versioning

Every versioned entity writes a `ContentVersion` snapshot on change, enabling a
visual diff history and rollback (Stage 5 improvement).
