import { describe, expect, it } from 'vitest';
import { contrastRatio, meetsAA } from '@/lib/utils/contrast';

/** WCAG contrast ratio tests (Stage 4 §11; Stage 5 §21). */
describe('contrast ratio', () => {
  it('computes maximum contrast for black on white', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
  });

  it('computes minimum contrast for identical colors', () => {
    expect(contrastRatio('#2563eb', '#2563eb')).toBeCloseTo(1, 5);
  });

  it('is symmetric regardless of argument order', () => {
    const a = contrastRatio('#020617', '#f8fafc');
    const b = contrastRatio('#f8fafc', '#020617');
    expect(a).toBeCloseTo(b, 5);
  });

  it('confirms the Stage 1 default text-primary/bg-page pairing passes AA', () => {
    expect(meetsAA('#020617', '#f8fafc')).toBe(true);
  });

  it('flags a low-contrast pairing as failing AA', () => {
    expect(meetsAA('#e2e8f0', '#f8fafc')).toBe(false);
  });

  it('applies the relaxed 3:1 threshold for large text', () => {
    // Verified pairing: #808080 on #f8fafc computes to ~3.77:1 — passes the 3:1
    // large-text threshold but fails the stricter 4.5:1 normal-text threshold.
    const fg = '#808080';
    const bg = '#f8fafc';
    const ratio = contrastRatio(fg, bg);
    expect(ratio).toBeGreaterThan(3);
    expect(ratio).toBeLessThan(4.5);
    expect(meetsAA(fg, bg, true)).toBe(true);
    expect(meetsAA(fg, bg, false)).toBe(false);
  });
});
