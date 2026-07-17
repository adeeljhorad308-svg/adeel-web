# Adeel IT Solutions Platform

Premium international software agency website and business platform. Built as a
modular monolith on Next.js 15 (App Router), TypeScript strict mode, Prisma +
Neon PostgreSQL, Auth.js, Cloudinary, Resend, Upstash Redis, and Trigger.dev.

This repository implements the approved Stage 1–5 specifications. See `docs/` for
the architecture blueprint, disaster recovery, and operational runbooks.

## Tech stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router, React Server Components) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + design tokens (Stage 1) |
| ORM / DB | Prisma / Neon PostgreSQL |
| Auth | Auth.js (database sessions), Argon2id hashing |
| Media | Cloudinary |
| Email | Resend |
| Cache / limits / locks | Upstash Redis |
| Background jobs | Trigger.dev |
| Observability | OpenTelemetry, structured logging (pino) |
| i18n | next-intl (English enabled; multilingual-ready) |
| Hosting | Vercel + Cloudflare |

## Prerequisites

- Node.js 20.11+
- A Neon PostgreSQL database
- Accounts/keys for Cloudinary, Resend, Upstash, Trigger.dev

## Getting started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Fill in the values (see .env.example for guidance)

# 3. Generate the Prisma client and run migrations
npm run prisma:generate
npm run prisma:migrate

# 4. Seed local development data (RBAC matrix, feature flags, super admin)
npm run db:seed

# 5. Start the dev server
npm run dev
```

App runs at http://localhost:3000. The admin dashboard lives under `/admin`
(built out in Phase 1+).

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run typecheck` | TypeScript type checking (no emit) |
| `npm run lint` | ESLint |
| `npm run format` | Prettier write |
| `npm run test` | Unit tests (Vitest) |
| `npm run test:integration` | Integration tests |
| `npm run test:e2e` | End-to-end tests (Playwright) |
| `npm run validate` | Typecheck + lint + format check + unit tests |
| `npm run prisma:migrate` | Create/apply a dev migration |
| `npm run db:seed` | Seed the database |
| `npm run trigger:dev` | Run the Trigger.dev local worker |

## Project structure

```
app/          Route groups: (public), (auth), admin, (utility), api/v1
components/   ui (primitives) · patterns · public · admin · providers
lib/          auth · db · services · validation · security · cache · email ·
              media · logging · jobs · i18n · telemetry · feature-flags · errors
tokens/       Design token source of truth + CSS variable bridge (Stage 1)
prisma/       schema.prisma · seed.ts · migrations
trigger/      Background job definitions
tests/        unit · integration · e2e
docs/         Architecture, DR, and operations runbooks
messages/     i18n message catalogs
```

## Architecture principles

- **Server Components by default**; client islands only where interactivity requires.
- **Server Actions** for admin mutations; **Route Handlers** for public/external APIs and webhooks.
- **Design tokens only** in components — no raw hex/px, so the Theme Manager can re-theme at runtime.
- **Authorization enforced server-side** on every action; the frontend only hides what a role can't use.
- **No hardcoded business content** — everything is CMS-driven.

## Documentation

- `docs/architecture.md` — system architecture overview
- `docs/disaster-recovery.md` — backup verification, restore, and migration rollback procedures
- `docs/operations.md` — runbooks and monitoring
