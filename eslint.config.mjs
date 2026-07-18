import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import prettier from 'eslint-config-prettier';
import { FlatCompat } from '@eslint/eslintrc';

/**
 * ESLint flat config (Stage 5 §23). Uses FlatCompat to consume the Next.js shared
 * config (which ships as legacy "extends"), composed with type-aware TypeScript
 * rules and Prettier compatibility. Enforces the project's strict standards:
 * no unchecked `any`, no floating promises, consistent type imports.
 *
 * Type-aware rules (`recommendedTypeChecked`) require `parserOptions.project`/
 * `projectService` to resolve each linted file against a tsconfig program.
 * Root-level config files (this file, next.config.ts, tailwind.config.ts, etc.)
 * are not part of the app's tsconfig "include" graph in the way that matters
 * for type-aware linting, so they are scoped OUT of the type-checked rule set
 * below and linted with plain (non-type-aware) rules only. Without this split,
 * ESLint fails immediately when it reaches this very file, since it can't
 * generate type information for itself.
 */
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const compat = new FlatCompat({ baseDirectory: __dirname });

const typeCheckedFiles = [
  'app/**/*.{ts,tsx}',
  'components/**/*.{ts,tsx}',
  'lib/**/*.{ts,tsx}',
  'tests/**/*.{ts,tsx}',
  'trigger/**/*.{ts,tsx}',
  'types/**/*.{ts,tsx}',
  'prisma/**/*.ts',
];

export default tseslint.config(
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'next-env.d.ts',
      'coverage/**',
      'playwright-report/**',
    ],
  },
  js.configs.recommended,
  ...compat.extends('next/core-web-vitals'),
  // Type-aware TypeScript rules apply ONLY to actual application source files.
  ...tseslint.configs.recommendedTypeChecked.map((config) => ({
    ...config,
    files: typeCheckedFiles,
  })),
  {
    files: typeCheckedFiles,
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: __dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      '@typescript-eslint/no-floating-promises': 'error',
      '@typescript-eslint/consistent-type-imports': [
        'error',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      eqeqeq: ['error', 'always'],
    },
  },
  // Root-level config files: plain JS/TS parsing only, no type-aware rules,
  // no project service — these files are not part of the typed program.
  {
    files: ['*.config.mjs', '*.config.ts', '*.config.js'],
    languageOptions: {
      parserOptions: {
        project: null,
        projectService: false,
      },
    },
    rules: {
      eqeqeq: ['error', 'always'],
    },
  },
  prettier,
  {
    // Seed and other CLI scripts legitimately print progress to stdout; the
    // no-console restriction exists for application code, not one-off scripts.
    files: ['prisma/seed.ts'],
    rules: {
      'no-console': 'off',
    },
  },
);
