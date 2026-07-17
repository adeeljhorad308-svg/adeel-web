/**
 * Design Token Source of Truth — Stage 1 Foundation.
 *
 * Three-tier architecture (Stage 1, Enhancement 1):
 *   Tier 1 — primitives: raw, immutable palette + scales. Never referenced by components.
 *   Tier 2 — semantic:   meaning-based aliases. What the Theme Manager edits at runtime.
 *   Tier 3 — component:  scoped per-component tokens (declared alongside components as needed).
 *
 * This file is the single upstream source. It feeds:
 *   - tailwind.config.ts (utility classes bound to CSS variables)
 *   - tokens/css-variables.ts (emits :root and .dark custom properties)
 *   - The future Theme Manager (writes Tier 2 values as CSS variables at runtime)
 *   - Figma Variables (same structure: Primitives / Semantic collections, Light/Dark modes)
 *
 * Rule: components consume Tier 2 (or Tier 3) only — never Tier 1 directly, and never raw hex.
 */

// ----------------------------------------------------------------------------
// TIER 1 — PRIMITIVES
// ----------------------------------------------------------------------------

export const primitives = {
  color: {
    blue: {
      50: '#EFF6FF',
      500: '#3B82F6',
      600: '#2563EB',
      700: '#1D4ED8',
    },
    indigo: {
      500: '#6366F1',
    },
    slate: {
      50: '#F8FAFC',
      100: '#F1F5F9',
      200: '#E2E8F0',
      500: '#64748B',
      700: '#334155',
      800: '#1E293B',
      900: '#0F172A',
      950: '#020617',
    },
    white: '#FFFFFF',
    green: { 500: '#22C55E' },
    amber: { 500: '#F59E0B' },
    red: { 500: '#EF4444' },
  },
  space: {
    0: '0px',
    1: '4px',
    2: '8px',
    3: '12px',
    4: '16px',
    5: '20px',
    6: '24px',
    8: '32px',
    10: '40px',
    12: '48px',
    16: '64px',
    20: '80px',
    24: '96px',
    32: '128px',
  },
  radius: {
    sm: '6px',
    md: '10px',
    lg: '16px',
    xl: '24px',
    full: '9999px',
  },
  fontSize: {
    overline: ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.08em' }],
    small: ['0.875rem', { lineHeight: '1.5' }],
    body: ['1rem', { lineHeight: '1.6' }],
    'body-lg': ['1.125rem', { lineHeight: '1.6' }],
    h4: ['1.375rem', { lineHeight: '1.3' }],
    h3: ['1.75rem', { lineHeight: '1.2' }],
    h2: ['2.25rem', { lineHeight: '1.15' }],
    h1: ['3rem', { lineHeight: '1.1' }],
    display: ['3.75rem', { lineHeight: '1.05' }],
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
  },
} as const;

// ----------------------------------------------------------------------------
// TIER 2 — SEMANTIC (light + dark modes)
// ----------------------------------------------------------------------------

/**
 * Semantic tokens map to CSS variable names (without the `--` prefix). Each has a
 * light and dark value. `tokens/css-variables.ts` emits these into :root and .dark.
 * Tailwind utilities reference the CSS variables so a runtime value change re-themes
 * the entire product without a rebuild.
 */
export interface SemanticColorToken {
  readonly cssVar: string;
  readonly light: string;
  readonly dark: string;
}

export const semanticColors = {
  'bg-page': { cssVar: 'color-bg-page', light: primitives.color.slate[50], dark: primitives.color.slate[950] },
  'bg-surface': { cssVar: 'color-bg-surface', light: primitives.color.white, dark: primitives.color.slate[900] },
  'bg-subtle': { cssVar: 'color-bg-subtle', light: primitives.color.slate[100], dark: primitives.color.slate[800] },
  'text-primary': { cssVar: 'color-text-primary', light: primitives.color.slate[950], dark: primitives.color.slate[50] },
  'text-body': { cssVar: 'color-text-body', light: primitives.color.slate[700], dark: primitives.color.slate[200] },
  'text-muted': { cssVar: 'color-text-muted', light: primitives.color.slate[500], dark: primitives.color.slate[500] },
  'border-default': { cssVar: 'color-border-default', light: primitives.color.slate[200], dark: primitives.color.slate[700] },
  'brand-primary': { cssVar: 'color-brand-primary', light: primitives.color.blue[600], dark: primitives.color.blue[500] },
  'brand-hover': { cssVar: 'color-brand-hover', light: primitives.color.blue[700], dark: primitives.color.blue[600] },
  'brand-tint': { cssVar: 'color-brand-tint', light: primitives.color.blue[50], dark: primitives.color.slate[800] },
  'feedback-success': { cssVar: 'color-feedback-success', light: primitives.color.green[500], dark: primitives.color.green[500] },
  'feedback-warning': { cssVar: 'color-feedback-warning', light: primitives.color.amber[500], dark: primitives.color.amber[500] },
  'feedback-error': { cssVar: 'color-feedback-error', light: primitives.color.red[500], dark: primitives.color.red[500] },
} as const satisfies Record<string, SemanticColorToken>;

export type SemanticColorName = keyof typeof semanticColors;

// ----------------------------------------------------------------------------
// MOTION, SHADOW, GRID, Z-INDEX (Stage 1 §9–§15)
// ----------------------------------------------------------------------------

export const motion = {
  duration: { fast: '150ms', base: '250ms', slow: '400ms' },
  easing: {
    out: 'cubic-bezier(0.16, 1, 0.3, 1)',
    inOut: 'cubic-bezier(0.65, 0, 0.35, 1)',
  },
} as const;

export const shadow = {
  sm: '0 1px 2px 0 rgb(2 6 23 / 0.06), 0 1px 3px 0 rgb(2 6 23 / 0.10)',
  md: '0 4px 6px -1px rgb(2 6 23 / 0.10), 0 2px 4px -2px rgb(2 6 23 / 0.08)',
  lg: '0 10px 15px -3px rgb(2 6 23 / 0.10), 0 4px 6px -4px rgb(2 6 23 / 0.10)',
} as const;

export const zIndex = {
  base: '0',
  dropdown: '1000',
  sticky: '1100',
  modal: '1300',
  toast: '1400',
} as const;

/** Eight named breakpoints (Stage 1, Enhancement 3). Min-width values. */
export const breakpoints = {
  xs: '320px',
  sm: '390px',
  md: '640px',
  'lg-t': '834px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1440px',
  '3xl': '1920px',
} as const;

export const contentMaxWidth = {
  lg: '1120px',
  xl: '1200px',
  '2xl': '1280px',
} as const;
