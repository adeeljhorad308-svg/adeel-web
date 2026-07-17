/**
 * WCAG contrast ratio calculation (Stage 1 §5, Stage 4 §11). Pure function, no
 * dependencies, usable both server-side (Theme Manager save validation) and
 * client-side (live preview warning) from the same source of truth.
 */

function hexToLinearChannel(hex: string, index: number): number {
  const value = parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16) / 255;
  return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
}

function relativeLuminance(hex: string): number {
  const r = hexToLinearChannel(hex, 0);
  const g = hexToLinearChannel(hex, 1);
  const b = hexToLinearChannel(hex, 2);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Contrast ratio between two hex colors, per WCAG 2.x formula (1–21). */
export function contrastRatio(hexA: string, hexB: string): number {
  const l1 = relativeLuminance(hexA);
  const l2 = relativeLuminance(hexB);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

/** WCAG 2.2 AA thresholds: 4.5:1 for normal text, 3:1 for large text/UI. */
export function meetsAA(hexA: string, hexB: string, isLargeText = false): boolean {
  return contrastRatio(hexA, hexB) >= (isLargeText ? 3 : 4.5);
}
