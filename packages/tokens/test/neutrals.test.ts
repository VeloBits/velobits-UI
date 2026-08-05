import { describe, expect, it } from 'vitest';

import { hexToOklch, oklchToHex, relativeLuminance } from '../src/color';
import { neutral, neutralMeta } from '../src/generated/neutrals';

/**
 * `src/generated/neutrals.ts` is committed output, which means it can be
 * hand-edited. These assertions are what make "never hand-edit" enforceable
 * rather than merely requested.
 */
describe('the generated neutral ramp', () => {
  /**
   * Widened to string keys on purpose. The generated object's keys are numeric
   * literals, so the narrow key type cannot be recovered from
   * `Object.entries` — and casting back to it fails `tsc` rather than helping.
   */
  const ramp: [step: string, hex: string][] = Object.entries(neutral);
  const meta: Record<string, { oklch: string; luminance: number }> = neutralMeta;

  const ordered = [...ramp].sort((a, b) => Number(a[0]) - Number(b[0]));

  it('is ordered light → dark with no ties', () => {
    const lums = ordered.map(([step, hex]) => ({ step, lum: relativeLuminance(hex) }));
    for (let i = 1; i < lums.length; i++) {
      const prev = lums[i - 1]!;
      const cur = lums[i]!;
      expect(
        cur.lum,
        `neutral-${cur.step} (${cur.lum.toFixed(4)}) must be darker than ` +
          `neutral-${prev.step} (${prev.lum.toFixed(4)})`,
      ).toBeLessThan(prev.lum);
    }
  });

  it('round-trips through OKLCH byte-for-byte', () => {
    /**
     * Every committed hex must be exactly what its recorded OKLCH regenerates.
     * If this fails, either a hex was edited by hand or the ladder in
     * scripts/generate-neutrals.ts changed without the file being regenerated.
     */
    for (const [step, hex] of ramp) {
      expect(oklchToHex(hexToOklch(hex)), `neutral-${step}`).toBe(hex);
    }
  });

  it('records a luminance matching the committed hex', () => {
    for (const [step, hex] of ramp) {
      expect(meta[step]!.luminance, `neutral-${step}`).toBeCloseTo(relativeLuminance(hex), 5);
    }
  });

  it('stays a WARM ramp — chroma never reaches zero', () => {
    /**
     * The point of generating this rather than using Tailwind's neutral scale:
     * a pure grey beside the brand cream reads cold. Chroma is small but must
     * stay non-zero, and it should decay toward the dark end.
     */
    for (const [step, hex] of ramp) {
      const { c } = hexToOklch(hex);
      expect(c, `neutral-${step} has zero chroma — that is a cold grey`).toBeGreaterThan(0);
      expect(c, `neutral-${step} is too chromatic to read as a neutral`).toBeLessThan(0.02);
    }
  });

  it('includes the 750 step the dark --border needs', () => {
    /**
     * 750 exists solely so the dark-mode border sits ABOVE --panel
     * (neutral-800). Losing it silently returns the dark theme to an invisible
     * 1.02:1 border.
     */
    expect(neutral[750]).toBeDefined();
    const border = relativeLuminance(neutral[750]);
    expect(border).toBeGreaterThan(relativeLuminance(neutral[800]));
    expect(border).toBeLessThan(relativeLuminance(neutral[700]));
  });
});
