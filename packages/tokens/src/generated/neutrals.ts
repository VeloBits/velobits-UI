/**
 * GENERATED FILE , do not edit.
 * Regenerate with: npm run generate -w @velobitsio/tokens
 * Source of truth: scripts/generate-neutrals.ts
 *
 * Warm neutral ramp: ONE hue (74°) held down the whole column, chroma decaying
 * toward the dark end, so a neutral never reads cold and never reads pink.
 */

/** Warm neutral ramp, light → dark. */
export const neutral = {
  50: '#F8F6F3',
  100: '#EEECE9',
  200: '#E1DFDC',
  300: '#C4C2C0',
  400: '#A4A3A1',
  500: '#838180',
  600: '#61605F',
  700: '#474645',
  750: '#373636',
  800: '#2D2D2C',
  900: '#1B1B1A',
  925: '#161615',
  950: '#0F0F0E',
} as const;

export type NeutralStep = keyof typeof neutral;

/** The OKLCH each ramp entry measures, and its WCAG relative luminance. */
export const neutralMeta = {
  50: { oklch: 'oklch(0.9747 0.0045 74.0)', luminance: 0.923391 },
  100: { oklch: 'oklch(0.9447 0.0045 74.0)', luminance: 0.840512 },
  200: { oklch: 'oklch(0.9045 0.0042 74.0)', luminance: 0.739502 },
  300: { oklch: 'oklch(0.8150 0.0040 74.0)', luminance: 0.541251 },
  400: { oklch: 'oklch(0.7159 0.0034 74.0)', luminance: 0.366601 },
  500: { oklch: 'oklch(0.6054 0.0030 74.0)', luminance: 0.220843 },
  600: { oklch: 'oklch(0.4900 0.0026 74.0)', luminance: 0.117334 },
  700: { oklch: 'oklch(0.3963 0.0020 74.0)', luminance: 0.061496 },
  750: { oklch: 'oklch(0.3350 0.0018 74.0)', luminance: 0.037169 },
  800: { oklch: 'oklch(0.2958 0.0016 74.0)', luminance: 0.026165 },
  900: { oklch: 'oklch(0.2206 0.0014 74.0)', luminance: 0.010915 },
  925: { oklch: 'oklch(0.1987 0.0014 74.0)', luminance: 0.007985 },
  950: { oklch: 'oklch(0.1668 0.0012 74.0)', luminance: 0.004749 },
} as const;
