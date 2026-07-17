import type { Config } from 'tailwindcss';
import {
  primitives,
  semanticColors,
  motion,
  shadow,
  zIndex,
  breakpoints,
  contentMaxWidth,
} from './tokens/tokens';

/**
 * Tailwind is bound to the Stage 1 token system. Color utilities reference CSS
 * variables (so the Theme Manager can re-theme at runtime), while non-themeable
 * scales (spacing, radius, type) are emitted directly from the token source.
 *
 * `withOpacity` lets Tailwind's `/opacity` modifiers work against CSS variables
 * by declaring each color as an rgb() consuming a channels variable. To keep the
 * Theme Manager simple we expose hex variables and forgo channel math here;
 * opacity modifiers on brand colors are intentionally avoided in components.
 */

const semanticColorUtilities = Object.fromEntries(
  Object.entries(semanticColors).map(([name, token]) => [name, `var(--${token.cssVar})`]),
);

const config: Config = {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './lib/**/*.{ts,tsx}',
  ],
  theme: {
    screens: {
      xs: breakpoints.xs,
      sm: breakpoints.sm,
      md: breakpoints.md,
      'lg-t': breakpoints['lg-t'],
      lg: breakpoints.lg,
      xl: breakpoints.xl,
      '2xl': breakpoints['2xl'],
      '3xl': breakpoints['3xl'],
    },
    extend: {
      colors: {
        // Semantic tokens (preferred in all components).
        ...semanticColorUtilities,
        // Primitives exposed only for token-editing surfaces (Theme Manager previews).
        primitive: primitives.color,
      },
      spacing: primitives.space,
      borderRadius: primitives.radius,
      fontSize: primitives.fontSize as unknown as Record<string, [string, { lineHeight: string; letterSpacing?: string }]>,
      fontWeight: primitives.fontWeight,
      fontFamily: {
        display: ['var(--font-space-grotesk)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        sans: ['var(--font-inter)', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        sm: shadow.sm,
        md: shadow.md,
        lg: shadow.lg,
      },
      transitionDuration: {
        fast: motion.duration.fast.replace('ms', ''),
        base: motion.duration.base.replace('ms', ''),
        slow: motion.duration.slow.replace('ms', ''),
      },
      transitionTimingFunction: {
        out: motion.easing.out,
        'in-out': motion.easing.inOut,
      },
      zIndex: {
        base: zIndex.base,
        dropdown: zIndex.dropdown,
        sticky: zIndex.sticky,
        modal: zIndex.modal,
        toast: zIndex.toast,
      },
      maxWidth: {
        'content-lg': contentMaxWidth.lg,
        'content-xl': contentMaxWidth.xl,
        'content-2xl': contentMaxWidth['2xl'],
      },
    },
  },
  plugins: [],
};

export default config;
