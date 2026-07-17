/**
 * Shared, framework-agnostic constants. Values that also exist as Prisma enums
 * are declared here as the canonical TypeScript source so non-Prisma code (RBAC,
 * validation, UI) can reference them without importing the generated client.
 * A unit test asserts these stay in sync with the Prisma schema.
 */

export const APP_NAME = 'Adeel IT Solutions';

/** The nine RBAC roles (Stage 4 §18, Stage 5 §8). */
export const ROLES = [
  'SUPER_ADMIN',
  'ADMIN',
  'DEVELOPER',
  'SALES',
  'ACCOUNTS',
  'MARKETING',
  'CONTENT_EDITOR',
  'SUPPORT',
  'VIEWER',
] as const;
export type Role = (typeof ROLES)[number];

/** Admin modules that permissions are scoped to. */
export const MODULES = [
  'DASHBOARD',
  'PORTFOLIO',
  'SERVICES',
  'INDUSTRIES',
  'TEAM',
  'TESTIMONIALS',
  'BLOG',
  'CONTACTS',
  'CRM',
  'MEDIA',
  'THEME',
  'NAVIGATION',
  'FOOTER',
  'SEO',
  'USERS',
  'NOTIFICATIONS',
  'SETTINGS',
  'ACTIVITY',
  'SEARCH',
] as const;
export type Module = (typeof MODULES)[number];

/** CRUD-plus actions a permission can grant. */
export const ACTIONS = ['VIEW', 'CREATE', 'EDIT', 'DELETE'] as const;
export type Action = (typeof ACTIONS)[number];

/** Content publication lifecycle. */
export const CONTENT_STATUS = ['DRAFT', 'PUBLISHED', 'ARCHIVED'] as const;
export type ContentStatus = (typeof CONTENT_STATUS)[number];

/** User account lifecycle. */
export const USER_STATUS = ['ACTIVE', 'SUSPENDED', 'INVITED'] as const;
export type UserStatus = (typeof USER_STATUS)[number];

/** Supported locales. English is the only one enabled initially; the
 *  architecture is multilingual-ready (Stage 5 improvement). */
export const LOCALES = ['en'] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = 'en';

/** Pagination defaults for admin data tables. */
export const PAGINATION = {
  defaultPageSize: 20,
  maxPageSize: 100,
} as const;

/** Upload constraints (Stage 5 §9). Enforced server-side after MIME sniffing. */
export const UPLOAD_LIMITS = {
  maxImageBytes: 10 * 1024 * 1024,
  maxVideoBytes: 100 * 1024 * 1024,
  maxDocumentBytes: 20 * 1024 * 1024,
  allowedImageMime: ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml'],
  allowedVideoMime: ['video/mp4', 'video/webm'],
  allowedDocumentMime: ['application/pdf'],
} as const;
