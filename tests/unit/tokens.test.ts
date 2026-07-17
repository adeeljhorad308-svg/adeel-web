import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { semanticColors } from '@/tokens/tokens';
import { lightThemeVariables, darkThemeVariables } from '@/tokens/css-variables';

/**
 * Token parity test (Stage 1 token bridge). Guarantees the CSS variables emitted
 * from the token source stay in sync with globals.css, so design and code never
 * drift. If someone edits one without the other, this fails.
 */
describe('design token bridge', () => {
  it('emits a CSS variable for every semantic color token', () => {
    for (const token of Object.values(semanticColors)) {
      expect(lightThemeVariables).toContain(`--${token.cssVar}:`);
      expect(darkThemeVariables).toContain(`--${token.cssVar}:`);
    }
  });

  it('keeps globals.css light theme in sync with the token source', () => {
    const cssPath = fileURLToPath(new URL('../../app/globals.css', import.meta.url));
    const css = readFileSync(cssPath, 'utf8');
    for (const token of Object.values(semanticColors)) {
      expect(css).toContain(`--${token.cssVar}: ${token.light};`);
    }
  });
});
