/**
 * Emits the semantic (Tier 2) color tokens as CSS custom properties for the
 * light theme (:root) and dark theme (.dark). Consumed by app/globals.css via
 * a build-time import is not possible for a .css file, so instead this module
 * produces the canonical strings that are mirrored in globals.css and can be
 * regenerated. The Theme Manager (later phase) overwrites these variables at
 * runtime to re-theme without a rebuild.
 *
 * Keeping this as typed data (not hand-written CSS) guarantees globals.css and
 * the token source never drift: a unit test asserts they match.
 */
import { semanticColors } from './tokens';

function emit(mode: 'light' | 'dark'): string {
  return Object.values(semanticColors)
    .map((token) => `  --${token.cssVar}: ${token[mode]};`)
    .join('\n');
}

/** CSS custom-property block for the light theme, without selector. */
export const lightThemeVariables = emit('light');

/** CSS custom-property block for the dark theme, without selector. */
export const darkThemeVariables = emit('dark');

/** Full stylesheet fragment (`:root { … }` and `.dark { … }`). */
export function renderThemeStylesheet(): string {
  return `:root {\n${lightThemeVariables}\n}\n\n.dark {\n${darkThemeVariables}\n}\n`;
}
