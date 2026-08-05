/**
 * Colour maths for the design system. Hand-written, because @velobits/tokens
 * ships with ZERO dependencies — see the eslint rule and §4 of the plan for why
 * that constraint is load-bearing (the Keycloak login theme consumes this
 * package and cannot consume anything React-shaped).
 *
 * Everything here is pure and synchronous so the contrast test can walk the
 * whole palette without fixtures.
 */

export type Rgb = readonly [number, number, number];
/** OKLCH. `l` 0-1, `c` 0-~0.4, `h` degrees 0-360. */
export interface Oklch {
  l: number;
  c: number;
  h: number;
}

const clamp01 = (n: number) => Math.min(1, Math.max(0, n));

/* ── sRGB transfer function ─────────────────────────────────────────────── */

/** sRGB channel (0-1, gamma-encoded) → linear-light. */
export function srgbToLinear(channel: number): number {
  return channel <= 0.04045 ? channel / 12.92 : Math.pow((channel + 0.055) / 1.055, 2.4);
}

/** Linear-light channel → gamma-encoded sRGB (0-1). */
export function linearToSrgb(channel: number): number {
  return channel <= 0.0031308 ? channel * 12.92 : 1.055 * Math.pow(channel, 1 / 2.4) - 0.055;
}

/* ── hex ↔ rgb ──────────────────────────────────────────────────────────── */

/** Parse `#rgb`, `#rrggbb` (with or without `#`) into 0-1 channels. */
export function hexToRgb(hex: string): Rgb {
  let h = hex.trim().replace(/^#/, '');
  if (h.length === 3) h = h[0]! + h[0]! + h[1]! + h[1]! + h[2]! + h[2]!;
  if (!/^[0-9a-fA-F]{6}$/.test(h)) throw new Error(`Not a hex colour: ${hex}`);
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
}

/** 0-1 channels → uppercase `#RRGGBB`, clamped into gamut. */
export function rgbToHex(rgb: Rgb): string {
  return (
    '#' +
    rgb
      .map((c) =>
        Math.round(clamp01(c) * 255)
          .toString(16)
          .padStart(2, '0'),
      )
      .join('')
      .toUpperCase()
  );
}

/* ── OKLab / OKLCH ──────────────────────────────────────────────────────── */
// Björn Ottosson's matrices, the same space Tailwind v4 and the Keycloak theme
// already express their palettes in.

function linearToOklab([r, g, b]: Rgb): Rgb {
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

function oklabToLinear([L, A, B]: Rgb): Rgb {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3;
  const m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3;
  const s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

export function hexToOklch(hex: string): Oklch {
  const [l, a, b] = linearToOklab(hexToRgb(hex).map(srgbToLinear) as unknown as Rgb);
  let h = (Math.atan2(b, a) * 180) / Math.PI;
  if (h < 0) h += 360;
  return { l, c: Math.hypot(a, b), h };
}

/**
 * OKLCH → hex. Out-of-gamut inputs are clipped per channel rather than
 * chroma-reduced; every value this repo generates is verified in-gamut by a
 * round-trip assertion in the test suite, so clipping never silently fires.
 */
export function oklchToHex({ l, c, h }: Oklch): string {
  const rad = (h * Math.PI) / 180;
  const linear = oklabToLinear([l, c * Math.cos(rad), c * Math.sin(rad)]);
  return rgbToHex(linear.map(linearToSrgb) as unknown as Rgb);
}

/** Format an OKLCH triple as a CSS `oklch()` function. */
export function formatOklch({ l, c, h }: Oklch, precision = 3): string {
  return `oklch(${l.toFixed(precision)} ${c.toFixed(precision)} ${h.toFixed(1)})`;
}

/* ── WCAG ───────────────────────────────────────────────────────────────── */

/** WCAG 2.x relative luminance. */
export function relativeLuminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(srgbToLinear) as unknown as Rgb;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2.x contrast ratio, 1-21. Order-independent. */
export function contrastRatio(a: string, b: string): number {
  const la = relativeLuminance(a);
  const lb = relativeLuminance(b);
  const [hi, lo] = la >= lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * Composite `foreground` at `alpha` over `backdrop` and return the flattened
 * hex.
 *
 * The blend happens in **gamma-encoded sRGB**, not linear light, because that
 * is what browsers actually do for `rgba()` and `backdrop-filter` (CSS Color 4
 * "simple alpha compositing"). The distinction is not academic: for a white
 * glass at α 0.70 over the charcoal backdrop, linear-light compositing returns
 * a colour ~38 8-bit steps lighter, which flips a failing muted-text pair into
 * a passing one. Measuring in the wrong space is how a palette ships an
 * inaccessible overlay while its own test suite reports green.
 */
export function compositeOver(foreground: string, backdrop: string, alpha: number): string {
  const f = hexToRgb(foreground);
  const b = hexToRgb(backdrop);
  const a = clamp01(alpha);
  return rgbToHex(f.map((c, i) => c * a + b[i]! * (1 - a)) as unknown as Rgb);
}

/** Round to 2dp the way the docs quote contrast ratios. */
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
