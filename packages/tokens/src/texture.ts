import { seed } from './palette';

/**
 * THE PAGE TEXTURE — the one thing in this system that is allowed to touch the
 * page background, and the reason the blur tier is worth paying for.
 *
 * ## Why this exists
 *
 * `glass.css` forbids glass on page backgrounds, and that rule stands. This is
 * not glass: it is what glass is measured *against*. The distinction matters
 * because of a fact that had made the entire blur tier decorative:
 *
 *   **Blurring a uniform page returns that same uniform page.**
 *
 * Every `backdrop-filter` in the system — the sticky AppShell header, the
 * sidebar rail, every tier-O overlay — was paying for a backdrop snapshot per
 * layer and moving zero pixels, because there was nothing behind them to smear.
 * A texture is the smallest change that makes a blur mean something. With one,
 * a sticky bar visibly drags the grid out of focus as content scrolls under it;
 * without one, `.glass-surface-blur` and `.glass-surface` are the same picture.
 *
 * This also supersedes Locked Decision 5 ("the page background is unchanged"),
 * deliberately and with sign-off, rather than by drift.
 *
 * ## THE INVARIANT: TEXTURE MAY ONLY DARKEN. NEVER LIGHTEN.
 *
 * This is the whole reason the feature costs nothing to the rest of the palette,
 * and it is not a stylistic preference — it is load-bearing arithmetic.
 *
 * Every tier-S measurement in this system is `composite(surface over --bg)`
 * compared against `--bg`, and in both themes a glass surface is *lighter* than
 * the page it sits on (that is what "raised" means — see the perceptibility
 * gate). So:
 *
 *   texture DARKENS the page  →  the gap between glass and page WIDENS
 *   texture LIGHTENS the page →  the gap NARROWS, and the gate's floor is real
 *
 * Measured, with the shipped values below, the tier-S separation from the page
 * goes **up** everywhere — and in dark it roughly doubles:
 *
 *   light   top 11 → 20/255    bottom  8 → 17/255
 *   dark    top 12 → 25/255    bottom  9 → 22/255
 *
 * That is why no existing token needed re-tuning to land this. Lightening would
 * have required it: light's bottom sheen stop sits on the 8/255 floor exactly,
 * so a mere +2/255 of page lift would have pushed it under, and every soft chip
 * and glass pair would have had to be re-measured.
 *
 * The direction also happens to be right for text: darkening the page raises
 * contrast for `--fg` and `--muted-fg` in both themes, because both are
 * light-on-dark in dark mode and dark-on-light in light mode.
 *
 * `texture-css.test.ts` asserts the invariant per channel, per layer, per theme.
 * If you want a *lit* bloom in dark mode, it does not go here — it goes on a
 * component, where it has a known backdrop.
 *
 * ## What actually binds these values, and it is different per theme
 *
 * Not the glass gate — the invariant above makes that free. In LIGHT it is
 * `--muted-fg` where both layers stack:
 *
 *   dot over field over cream → #EAE2E0, `--muted-fg` **4.60:1** (AA needs 4.5)
 *
 * ~0.1 of margin, so light is at its ceiling: at 1.5× these alphas it measures
 * 4.42:1 and fails. Deepening a light layer fails as unreadable secondary labels
 * on the page, not as ugly glass.
 *
 * In DARK **nothing accessibility-shaped binds it at all.** Darkening a near-black
 * page raises text contrast, so `--muted-fg` climbs (7.72 → 8.04 → 8.34:1) as the
 * texture deepens; pure black dots would still pass every gate in the suite. The
 * only limit is {@link TEXTURE_DEPTH_CEILING}, which is a judgement about when the
 * page stops reading as charcoal. That asymmetry is why dark's dot runs at twice
 * light's depth and why the two must not be kept in step "for consistency".
 *
 * Note that the worst case is measured as the two layers STACKED, not averaged
 * by coverage. A dot is 1px on a 48px pitch — under 0.2% of the page — so
 * arguing from coverage would let both layers go much deeper. It is not worth
 * the argument: the stacked worst case passes, so the cheap gate is also the
 * honest one.
 */
export interface TextureLayer {
  /** The colour painted over the page. Must be DARKER than `--bg` on every channel. */
  colour: string;
  /** Alpha it is painted at. */
  alpha: number;
}

export interface TextureTheme {
  /**
   * The dot grid — the high-frequency half, and the part a blur actually smears.
   * A flat wash blurs to itself; a grid blurs to a soft haze, which is the
   * visible difference between `.glass-surface-blur` and `.glass-surface`.
   */
  dot: TextureLayer;
  /**
   * The low-frequency half: one broad radial bloom, placed off-centre, that
   * keeps a large empty page from reading as a flat slab.
   *
   * Both themes tint it toward **plum** rather than using a neutral black, which
   * is a small deliberate contribution to hue breadth: it puts a non-blue seed
   * at the very bottom of the stack, under everything. In light that is the plum
   * seed directly. In dark the seed itself would LIGHTEN the near-black page
   * (#592941 over #151615 lifts it +7/+2/+4 — the invariant forbids it), so dark
   * uses a plum-black instead: it darkens on every channel while still pulling
   * the hue toward magenta rather than grey.
   */
  field: TextureLayer;
}

/**
 * The dot pitch. Theme-independent, and the one texture value that is not a
 * colour — hence declared once rather than per theme.
 *
 * 48px matches velobits-website, which is described in the roadmap as "the one
 * consumer where component glass reads correctly out of the box". That was never
 * a coincidence: the website already had a grid behind its glass, and this token
 * is what generalises the accident into the system.
 */
export const TEXTURE_GRID = '48px';

/**
 * The deepest any single texture layer may sit below `--bg`, per channel.
 *
 * **Per theme, because the two themes are bounded by completely different things**
 * — this is the single most surprising measurement in this file.
 *
 * ```
 *              stacked depth   --muted-fg   what actually limits it
 *   light        11/255          4.60:1     WCAG AA. Nothing else.
 *   dark         16/255          8.04:1     Taste. This ceiling, and only this.
 * ```
 *
 * In **light** the texture darkens a pale page, so it eats contrast: at 1.5× the
 * shipped alphas `--muted-fg` falls to 4.42:1 and fails AA. Light is therefore
 * pinned at its measured maximum and this ceiling is a formality — accessibility
 * binds first, and by a wide margin.
 *
 * In **dark** the texture darkens an already near-black page, so it *adds*
 * contrast: `--muted-fg` climbs from 7.72:1 to 8.34:1 as the texture deepens, and
 * there is no accessibility limit anywhere in the range. Pure black dots would
 * still pass every gate. So in dark this number is the ONLY thing standing between
 * "a charcoal page with texture on it" and "a black page", and it is a judgement
 * rather than a measurement. 16/255 is roughly 70% of the way to black; past that
 * the page stops reading as charcoal.
 *
 * If you are raising the dark value: nothing will fail, and that is exactly why
 * the number is written down here with a reason.
 */
export const TEXTURE_DEPTH_CEILING = { light: 8, dark: 16 } as const;

export const texture = {
  light: {
    // Charcoal — the light theme's own foreground, so the grid is the page's ink
    // rather than an imported grey. 6/255 at the dot centre.
    dot: { colour: seed.charcoal, alpha: 0.03 },
    // The plum seed, at the lowest alpha that still reads as a warm bloom rather
    // than a smudge. 5/255 at the bloom's peak.
    field: { colour: seed.plum, alpha: 0.025 },
  },
  dark: {
    /*
     * Black, not a ramp step. The dark page is `neutral-925` and already close to
     * black, so the only direction with any room is straight down; a ramp step
     * would be a lighter grey and would lighten it.
     *
     * **13/255 at the dot centre — roughly twice light's 6, deliberately.** The
     * themes are NOT symmetric here and should not be made so. Light is pinned at
     * its accessibility ceiling (see {@link TEXTURE_DEPTH_CEILING}); dark has no
     * accessibility ceiling at all, because darkening a near-black page raises
     * text contrast rather than lowering it. At these alphas `--muted-fg` measures
     * **8.04:1**, better than the 7.72:1 the shallower version gave.
     *
     * The shallower first pass (α 0.30, 7/255) was measured as correct and looked
     * like nothing: 7 units out of 21 is arithmetically a large relative change
     * and still perceptually absent on a dark display. This is the value that
     * makes the grid actually visible, and therefore the value that gives the blur
     * tier something worth blurring.
     */
    dot: { colour: '#000000', alpha: 0.6 },
    // A plum-BLACK, not the plum seed — see `TextureTheme.field`. Darkens on all
    // three channels while leaning the hue toward magenta. 8/255 at the peak.
    field: { colour: '#0E060B', alpha: 0.5 },
  },
} as const satisfies Record<'light' | 'dark', TextureTheme>;

export type TextureLayerName = keyof TextureTheme;
