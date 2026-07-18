import 'server-only';
import { PrismaClient } from '@prisma/client';
import { serverEnv } from '@/lib/config/env';

/**
 * Prisma client singleton (Stage 5 §1, §4).
 *
 * A single instance is reused across the app. In development, Next.js hot-reload
 * re-evaluates modules frequently, which would otherwise exhaust the Neon
 * connection pool by creating a new client each time — so we cache the instance
 * on `globalThis`. In production a fresh module scope means a single client.
 *
 * Connection pooling for serverless is handled at the connection-string level
 * (Neon pooled `DATABASE_URL`); migrations use the unpooled `DIRECT_URL`.
 */

const createPrismaClient = (): PrismaClient =>
  new PrismaClient({
    log: serverEnv.NODE_ENV === 'development' ? ['query', 'warn', 'error'] : ['warn', 'error'],
  });

type PrismaGlobal = typeof globalThis & {
  prismaClient?: PrismaClient;
};

const globalForPrisma = globalThis as PrismaGlobal;

export const prisma: PrismaClient = globalForPrisma.prismaClient ?? createPrismaClient();

if (serverEnv.NODE_ENV !== 'production') {
  globalForPrisma.prismaClient = prisma;
}
