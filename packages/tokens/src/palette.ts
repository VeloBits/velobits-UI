import { neutral } from './generated/neutrals';

/**
 * The five brand seeds, in the only place they are literal.
 *
 * Both product logos corroborate the two chromatic seeds:
 * `vb-assets/Velobits/velobits.svg` is a single `#c8f135` fill, and
 * `vb-assets/ToggleFlow/ToggleFlow-svg-logo.svg` is `#007acc`.
 *
 * Their OKLCH values and every contrast pairing derived from them are asserted
 * in `test/contrast.test.ts` — see `docs/VelobitsUI/VELOBITS_DESIGN_SYSTEM.md`
 * for the measurement table.
 */
export const seed = {
  /** `primary` — fills and the focus ring. NOT a text colour; see `primaryText`. */
  blue: '#007ACC',
  /** `brand` — accent fills, badges, charts. Fill-only in light mode. */
  lime: '#C8F135',
  /** Light-mode page background. */
  cream: '#F4EDEA',
  /** Dark base, and the light-mode foreground. */
  charcoal: '#2A2B2A',
  /** Light-mode text accent, and the dark-mode elevated glass tint. */
  plum: '#592941',
} as const;

/**
 * Blue's derived text steps. The seed measures **3.90:1 on cream**, which fails
 * AA for text — so `primary` is a fill token and links use these instead. This
 * is the single most common way to misuse this palette:
 * **never use `--primary` for a link, an icon beside text, or body copy.**
 */
export const blueSteps = {
  /** L=.525 — 4.68:1 on cream, 5.41:1 on white. */
  text: '#006CBD',
  /** L=.700 — 6.51:1 on the dark page. */
  textDark: '#42A4F9',
  /** Light hover/pressed fill. */
  hover: '#0062A3',
  /** Dark hover fill, matching ToggleFlow's existing `--accent-hover`. */
  hoverDark: '#1177BB',
  /** Dark focus ring — 5.37:1 on the dark page, well past the 3:1 floor. */
  ringDark: '#3094E8',
} as const;

/**
 * Plum's light-mode text step. Marginally darker than the seed (10.12:1 vs
 * 9.98:1 on cream); the seed itself is what tints dark-mode elevated glass.
 */
export const plumSteps = { text: '#582840' } as const;

export { neutral };
export type { NeutralStep } from './generated/neutrals';

/**
 * The seven worst-case backdrops the glass tier is measured against — the
 * palette's extremes in both directions plus every large chromatic fill a
 * surface can plausibly float over.
 */
export const worstCaseBackdrops = [
  seed.lime,
  seed.cream,
  '#FFFFFF',
  seed.charcoal,
  neutral[950],
  seed.blue,
  seed.plum,
] as const;
