import { neutral } from './generated/neutrals';

/**
 * The five brand seeds, in the only place they are literal.
 *
 * Both product logos corroborate the two chromatic seeds: the VeloBits mark is
 * a single `#c8f135` fill, and the dashboard app's mark is `#007acc`.
 *
 * Their OKLCH values and every contrast pairing derived from them are asserted
 * in `test/contrast.test.ts` , see `docs/VelobitsUI/VELOBITS_DESIGN_SYSTEM.md`
 * for the measurement table.
 */
export const seed = {
  /** `primary` , fills and the focus ring. NOT a text colour; see `primaryText`. */
  blue: '#007ACC',
  /** `brand` , accent fills, badges, charts. Fill-only in light mode. */
  lime: '#C8F135',
  /**
   * Light-mode page background. Generated from `oklch(0.947 0.0045 74)`; the
   * committed hex measures `oklch(0.947 0.005 78.3)`, because at chroma this low
   * the 8-bit grid is coarser than the hue step , the same quantisation the
   * neutral ramp records per row.
   *
   * **Was `cream: '#F4EDEA'`, and the rename is the point.** That value sat at
   * hue 44.9° with chroma 0.0086, which is pink-orange: it put R ten 8-bit steps
   * above B with G below the R..B midpoint, i.e. a magenta cast on the largest
   * surface in the product. It read as dusty beige rather than as a page.
   *
   * This value carries the same warmth on the yellow side of orange, at half the
   * chroma, so it reads as *paper*: R−B = 5. It also sits on {@link neutral}'s
   * hue, which the old seed did not , the ramp drifted from 44.9° to 145.5°, so
   * `--muted-fg` was a green-grey on a pink page. See
   * `scripts/generate-neutrals.ts`.
   *
   * L dropped 0.951 → 0.947, which is under one 8-bit step of luminance and
   * moves no contrast pair meaningfully. What it does buy is glass headroom: the
   * Tier-S stops now clear 9–12/255 from BOTH the page and `--panel` on
   * *luminance*, where the old pair scraped the 8/255 floor and got its
   * separation from the pink cast on the blue channel alone.
   */
  paper: '#EFEDEA',
  /** Dark base, and the light-mode foreground. */
  charcoal: '#2A2B2A',
  /** Light-mode text accent, and the dark-mode elevated glass tint. */
  plum: '#592941',
} as const;

/**
 * Blue's derived text steps. The seed measures **3.86:1 on the page**, which fails
 * AA for text , so `primary` is a fill token and links use these instead. This
 * is the single most common way to misuse this palette:
 * **never use `--primary` for a link, an icon beside text, or body copy.**
 */
export const blueSteps = {
  /**
   * L=.495 , 5.29:1 on the page, 6.18:1 on white. Darker than flat-pair AA alone
   * would need: this step also has to clear 4.5:1 *inside a soft chip*, i.e.
   * composited over `primarySoft`/`infoSoft` on the page , the soft-chip
   * suite in `test/contrast.test.ts`. The previous `#006CBD` measured 4.08:1
   * there.
   */
  text: '#0062B3',
  /**
   * L=.723 , 7.10:1 on the dark page. Lifted for the same reason `text` was
   * darkened: over `primarySoft` on the dark panel the previous `#42A4F9`
   * measured 4.23:1.
   */
  textDark: '#4AACFF',
  /** Light hover/pressed fill. */
  hover: '#0062A3',
  /** Dark hover fill, matching the dashboard app's existing `--accent-hover`. */
  hoverDark: '#1177BB',
  /** Dark focus ring , 5.37:1 on the dark page, well past the 3:1 floor. */
  ringDark: '#3094E8',
} as const;

/**
 * Plum's light-mode text step. Marginally darker than the seed (10.12:1 vs
 * 9.89:1 on the page); the seed itself is what tints dark-mode elevated glass.
 */
export const plumSteps = { text: '#582840' } as const;

/**
 * Teal , the hue `info` is built from, and the reason `info` is no longer blue.
 *
 * ## Why this exists at all
 *
 * `--info` used to be `blueSteps.text`, which made it **byte-identical** to
 * `--primary-text` in both themes (`#0062B3` light, `#4AACFF` dark). "This is
 * informational" and "this is a link" were the same colour, so the distinction
 * could not be rendered , and no gate caught it, because every pair each token
 * belongs to passed on its own. It stayed invisible only because
 * `Badge variant="info"` happened to be unused.
 *
 * Teal rather than a re-tuned blue: two blues one step apart would fail the same
 * way the first time anyone put a link inside an info chip. The hue is taken from
 * `chart5` (#368A8A / #3B8F8E), which already proves this family clears the
 * non-text floor against both pages , the steps below are that hue pushed to
 * clear *text* AA, which the isoluminant chart values are not required to do.
 *
 * ## Both steps are tuned against the SOFT CHIP, not the page
 *
 * Same discipline as the status tokens: the worst composite a teal chip sits on
 * is not the page but the wash flattened over its darkest/lightest backdrop ,
 * for light that is the page, for dark the panel. The seed itself measures
 * ~3.1:1 in both themes inside a chip and is not usable as text.
 */
export const tealSteps = {
  /** 5.04:1 inside a soft chip on the page, 5.99:1 flat. `#2A6E6E` measures ~4.37 in the chip. */
  text: '#256262',
  /** 4.94:1 inside a soft chip on the dark panel, 6.19:1 flat. `#59A8A7` measures 4.12. */
  textDark: '#6FBAB9',
} as const;

/**
 * Rose , the one genuinely new hue in the palette, for tone assignment where the
 * meaning is categorical rather than a status.
 *
 * The five status/accent families the system had (blue, lime, green, red, amber)
 * are all either a status or the brand, so anything needing a *neutral category
 * colour* had to borrow one and imply a severity it did not mean. Rose carries no
 * status reading in either theme, which is the whole point of it.
 *
 * Hue taken from `chart3` (#BC5F8D / #C06492) for the same reason teal comes from
 * `chart5`: that value is already measured against both pages, so this is an
 * existing hue promoted to a text-safe tone rather than a sixth seed invented
 * from nothing. It is deliberately NOT plum , plum is `--elevated` in dark mode
 * and `--accent-text` flips to lime there, so the plum family cannot carry a
 * symmetric tone without colliding with a surface.
 *
 * Both steps land on ~4.6:1 inside a soft chip, which is the house standard the
 * status tokens were re-tuned to on 2026-08-06 (worst composite 4.61).
 */
export const roseSteps = {
  /** 4.61:1 inside a soft chip on the page, 5.45:1 flat. */
  text: '#9B3E6B',
  /** 4.56:1 inside a soft chip on the dark panel, 5.63:1 flat. */
  textDark: '#DA8FB2',
} as const;

export { neutral };
export type { NeutralStep } from './generated/neutrals';

/**
 * The seven worst-case backdrops the glass tier is measured against , the
 * palette's extremes in both directions plus every large chromatic fill a
 * surface can plausibly float over.
 */
export const worstCaseBackdrops = [
  seed.lime,
  seed.paper,
  '#FFFFFF',
  seed.charcoal,
  neutral[950],
  seed.blue,
  seed.plum,
] as const;
