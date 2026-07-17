/**
 * Database seed (Stage 5 improvement: realistic seed data for local dev/testing).
 *
 * Seeds:
 *   - The default RBAC permission rows from the approved matrix.
 *   - Feature flags for future modules (all disabled by default).
 *   - A Super Admin account for local development (credentials from env, or safe
 *     defaults clearly intended for local use only).
 *
 * This seed contains development scaffolding only — no fabricated public business
 * content (no fake projects, testimonials, clients, or metrics), honoring the
 * Master Spec rule against inventing business information.
 */
import { PrismaClient } from '@prisma/client';
import argon2 from 'argon2';
import { defaultPermissionRows } from '../lib/auth/permissions';
import { FEATURE_FLAGS } from '../lib/feature-flags';

const prisma = new PrismaClient();

async function seedPermissions(): Promise<void> {
  const rows = defaultPermissionRows();
  for (const row of rows) {
    await prisma.rolePermission.upsert({
      where: {
        role_module_action: { role: row.role, module: row.module, action: row.action },
      },
      create: row,
      update: { allowed: row.allowed },
    });
  }
  console.log(`Seeded ${rows.length} default permission rows.`);
}

async function seedFeatureFlags(): Promise<void> {
  const flags = Object.values(FEATURE_FLAGS).map((key) => ({
    key,
    description: `Future module flag: ${key}`,
    enabled: false,
  }));
  for (const flag of flags) {
    await prisma.featureFlag.upsert({
      where: { key: flag.key },
      create: flag,
      update: {},
    });
  }
  console.log(`Seeded ${flags.length} feature flags (all disabled).`);
}

async function seedSuperAdmin(): Promise<void> {
  const email = process.env.SEED_ADMIN_EMAIL ?? 'admin@adeelit.local';
  const password = process.env.SEED_ADMIN_PASSWORD ?? 'ChangeMe!Local123';

  const passwordHash = await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
  });

  await prisma.user.upsert({
    where: { email },
    create: {
      email,
      name: 'Local Super Admin',
      role: 'SUPER_ADMIN',
      status: 'ACTIVE',
      emailVerified: new Date(),
      passwordHash,
    },
    update: {},
  });

  console.log(`Seeded Super Admin: ${email}`);
  if (!process.env.SEED_ADMIN_PASSWORD) {
    console.log('  (Using default local password — set SEED_ADMIN_PASSWORD to override.)');
  }
}

async function main(): Promise<void> {
  console.log('Seeding database…');
  await seedPermissions();
  await seedFeatureFlags();
  await seedSuperAdmin();
  console.log('Seed complete.');
}

main()
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
