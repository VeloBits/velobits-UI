import { neutral } from './generated/neutrals';

/**
 * The five brand seeds, in the only place they are literal.
 *
 * Both product logos corroborate the two chromatic seeds: the VeloBits mark is
 * a single `#c8f135` fill, and the dashboard app's mark is `#007acc`.
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
  /**
   * L=.495 — 5.34:1 on cream, 6.18:1 on white. Darker than flat-pair AA alone
   * would need: this step also has to clear 4.5:1 *inside a soft chip*, i.e.
   * composited over `primarySoft`/`infoSoft` on the cream page — the soft-chip
   * suite in `test/contrast.test.ts`. The previous `#006CBD` measured 4.08:1
   * there.
   */
  text: '#0062B3',
  /**
   * L=.723 — 7.10:1 on the dark page. Lifted for the same reason `text` was
   * darkened: over `primarySoft` on the dark panel the previous `#42A4F9`
   * measured 4.23:1.
   */
  textDark: '#4AACFF',
  /** Light hover/pressed fill. */
  hover: '#0062A3',
  /** Dark hover fill, matching the dashboard app's existing `--accent-hover`. */
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
