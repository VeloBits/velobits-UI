/**
 * GENERATED FILE — do not edit.
 * Regenerate with: npm run generate -w @velobits/tokens
 * Source of truth: scripts/generate-neutrals.ts
 *
 * Warm neutral ramp: cream's hue held at the light end, chroma decaying toward
 * the dark end, so a neutral beside the brand cream never reads cold.
 */

/** Warm neutral ramp, light → dark. */
export const neutral = {
  50: '#FCF5F2',
  100: '#F2EBE8',
  200: '#E4DEDB',
  300: '#D0CBC7',
  400: '#A5A39F',
  500: '#82827E',
  600: '#646562',
  700: '#464745',
  750: '#383635',
  800: '#2C2D2C',
  900: '#1A1B1A',
  925: '#151615',
  950: '#0E0F0E',
} as const;

export type NeutralStep = keyof typeof neutral;

/** The OKLCH each ramp entry measures, and its WCAG relative luminance. */
export const neutralMeta = {
  50: { oklch: 'oklch(0.9747 0.0085 44.9)', luminance: 0.924111 },
  100: { oklch: 'oklch(0.9447 0.0086 44.9)', luminance: 0.841201 },
  200: { oklch: 'oklch(0.9045 0.0077 48.6)', luminance: 0.738510 },
  300: { oklch: 'oklch(0.8450 0.0078 61.4)', luminance: 0.602453 },
  400: { oklch: 'oklch(0.7159 0.0062 84.6)', luminance: 0.366969 },
  500: { oklch: 'oklch(0.6054 0.0059 106.6)', luminance: 0.222174 },
  600: { oklch: 'oklch(0.5049 0.0048 121.6)', luminance: 0.128985 },
  700: { oklch: 'oklch(0.3963 0.0036 128.6)', luminance: 0.062382 },
  750: { oklch: 'oklch(0.3350 0.0030 44.9)', luminance: 0.037361 },
  800: { oklch: 'oklch(0.2958 0.0023 145.5)', luminance: 0.025941 },
  900: { oklch: 'oklch(0.2206 0.0024 145.5)', luminance: 0.010781 },
  925: { oklch: 'oklch(0.1987 0.0025 145.5)', luminance: 0.007874 },
  950: { oklch: 'oklch(0.1668 0.0026 145.5)', luminance: 0.004667 },
} as const;
