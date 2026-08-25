import { describe, expect, it } from 'vitest';

import {
  compositeOver,
  contrastRatio,
  formatOklch,
  hexToOklch,
  hexToRgb,
  oklchToHex,
  relativeLuminance,
  rgbToHex,
} from '../src/color';
import { seed } from '../src/palette';

describe('hex parsing', () => {
  it('accepts long and short form, with or without #', () => {
    expect(rgbToHex(hexToRgb('#007ACC'))).toBe('#007ACC');
    expect(rgbToHex(hexToRgb('007acc'))).toBe('#007ACC');
    expect(rgbToHex(hexToRgb('#fff'))).toBe('#FFFFFF');
  });

  it('rejects anything else rather than silently returning black', () => {
    expect(() => hexToRgb('rgb(0,0,0)')).toThrow(/Not a hex colour/);
    expect(() => hexToRgb('#12345')).toThrow(/Not a hex colour/);
  });

  it('clamps out-of-range channels into gamut', () => {
    expect(rgbToHex([-1, 0.5, 2])).toBe('#0080FF');
  });
});

describe('OKLCH conversion', () => {
  it('reproduces the published seed values', () => {
    // These are quoted in the design system docs; they are the numbers the
    // palette was chosen by.
    expect(formatOklch(hexToOklch(seed.blue))).toBe('oklch(0.567 0.155 248.5)');
    expect(formatOklch(hexToOklch(seed.lime))).toBe('oklch(0.898 0.203 121.8)');
    // Was `cream` at `oklch(0.951 0.009 44.9)`. Hue 44.9° is pink-orange and
    // chroma 0.009 made it visible on the largest surface in the product; this
    // seed carries the same warmth at 74°, on the neutral ramp's own hue, at half
    // the chroma. See the docblock on `seed.paper`.
    expect(formatOklch(hexToOklch(seed.paper))).toBe('oklch(0.947 0.005 78.3)');
    expect(formatOklch(hexToOklch(seed.charcoal))).toBe('oklch(0.288 0.002 145.5)');
    expect(formatOklch(hexToOklch(seed.plum))).toBe('oklch(0.355 0.077 350.5)');
  });

  it('round-trips every seed', () => {
    for (const [name, hex] of Object.entries(seed)) {
      expect(oklchToHex(hexToOklch(hex)), name).toBe(hex);
    }
  });

  it('keeps hue stable and lightness monotonic', () => {
    const base = hexToOklch(seed.blue);
    const lighter = oklchToHex({ ...base, l: base.l + 0.1 });
    expect(relativeLuminance(lighter)).toBeGreaterThan(relativeLuminance(seed.blue));
    expect(hexToOklch(lighter).h).toBeCloseTo(base.h, 0);
  });
});

describe('WCAG contrast', () => {
  it('brackets at the documented extremes', () => {
    expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
    expect(contrastRatio('#007ACC', '#007ACC')).toBeCloseTo(1, 10);
  });

  it('is order-independent', () => {
    expect(contrastRatio('#007ACC', '#FFFFFF')).toBeCloseTo(
      contrastRatio('#FFFFFF', '#007ACC'),
      10,
    );
  });
});

describe('alpha compositing', () => {
  it('is a no-op at the endpoints', () => {
    expect(compositeOver('#FFFFFF', '#000000', 1)).toBe('#FFFFFF');
    expect(compositeOver('#FFFFFF', '#000000', 0)).toBe('#000000');
  });

  it('blends in GAMMA space, not linear light', () => {
    /**
     * The distinction that makes the glass measurements correct. White at α 0.5
     * over black is #808080 in gamma space (what a browser paints) and ~#BCBCBC
     * in linear light. Getting this wrong overstates glass legibility by a wide
     * margin.
     */
    expect(compositeOver('#FFFFFF', '#000000', 0.5)).toBe('#808080');
  });

  it('clamps alpha rather than extrapolating', () => {
    expect(compositeOver('#FFFFFF', '#000000', 5)).toBe('#FFFFFF');
    expect(compositeOver('#FFFFFF', '#000000', -1)).toBe('#000000');
  });
});
