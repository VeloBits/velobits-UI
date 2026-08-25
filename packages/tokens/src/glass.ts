// `neutral` is deliberately NOT imported any more. Every tier here is a literal
// now, because the one tier that referenced a ramp step (`dark: neutral[900]`)
// silently became the page colour when `--bg` was also `neutral[900]` , see the
// docblock on `dark` below. Reaching for the ramp again is how that returns.
import { seed } from './palette';

/**
 * TWO TIERS, AND THEY ARE NOT THE SAME MATERIAL.
 *
 * **Tier O , overlay.** Surfaces that float over page content: Dialog ·
 * Sheet/SidePanel · Popover · DropdownMenu · CommandPalette · Toast. The
 * backdrop is arbitrary, so every value is measured against all seven
 * {@link worstCaseBackdrops}, and muted text steps up to `--muted-on-glass`.
 * Tiers `light` / `dark` / `darkElevated` below.
 *
 * **Tier S , component surface.** Card · Panel · Table shell · Accordion ·
 * EmptyState · Sidebar · sticky TopBar. The backdrop is KNOWN , it is the page
 * , so the values are measured against exactly one thing and `--muted-fg` is
 * safe on it (5.92:1 in light, 6.34:1 in dark). Tiers `surfaceLight` /
 * `surfaceDark` below.
 *
 * Forbidden on both tiers: page and body backgrounds (nothing behind them to
 * see), and nested glass.
 *
 * ## Tier S cannot be Tier O with a different class name
 *
 * Composited over the flat page, the obvious "panel colour at α 0.85" is a
 * measurable NO-OP:
 *
 *   light  #FFFFFF @0.85 over #EFEDEA → #FDFCFC, **3/255** from opaque #FFFFFF
 *   dark   the dark panel @0.85 over the dark page → **3/255** from that panel
 *
 * Three 8-bit steps is below any perceptual threshold, and blurring a uniform
 * page returns that same uniform page , so the browser pays for a backdrop
 * repaint and the user sees an opaque card. The Tier-S surfaces are therefore
 * TINTED off both the page and the panel, and `test/contrast.test.ts` gates the
 * separation at ≥{@link PERCEPTIBILITY_FLOOR}/255 against BOTH.
 *
 * ## The treatment is asymmetric, because light cannot be lightened
 *
 * A white top-edge specular highlight at {@link GLASS_SPECULAR_ALPHA} measures
 * **1.03:1** over the light composite and **5.05:1** over the dark one , the
 * single most important number in this file. It means:
 *
 *   dark   the specular highlight carries the material. It is what reads as
 *          "a lit edge", and it costs nothing.
 *   light  no highlight at all (`transparent`). The material comes from the
 *          tint (#FCFAF8 , the ramp's own hue and chroma at L 0.9855,
 *          the only direction with room left in the gamut), a FIRMER hairline
 *          border (1.81:1, against the opaque `--border`'s 1.61:1 on `--panel`
 *          where the Tier-O border manages only 1.21:1), and a bottom-weighted
 *          shadow.
 *
 * Do not "fix" the asymmetry by giving light a highlight. It is invisible there
 * at ANY alpha , that is the point of the 1.03:1 figure, and a test pins it.
 * Dark's missing *shadow* was a different case and it was simply wrong: dark
 * now has one (a modest ~12/255 of lift, which is all a near-black page allows,
 * but more than the nothing it had).
 *
 * ## Why the tint is not the lever
 *
 * A Tier-S composite must clear {@link PERCEPTIBILITY_FLOOR} from the page
 * BELOW it and from the opaque `--panel` ABOVE it, so the page↔panel distance
 * is the whole budget and the tint is boxed in from both sides. In light,
 * the shipped pair sits at 12/9 and the de-pinked ramp leaves no chroma lever ,
 * cooling the tint only moves it toward the neutral white panel, so the
 * separation has to come from lightness. In dark the budget itself was widened (page → 925) to
 * buy 9/9 → 12/11. Past that, the material has to come from edge, light and
 * elevation, and all three are effectively ungated.
 *
 * ## Performance rules
 *
 *  - `backdrop-filter` is the expensive half, so Tier S does not use it. Plain
 *    `.glass-surface` is background + border + shadow, which is what makes it
 *    safe on a REPEATED component. `.glass-surface-blur` opts in, and is for
 *    sticky bars and sidebars where content genuinely scrolls behind.
 *  - Cap roughly **6 live blur layers** per view. Each one is a separate
 *    backdrop snapshot.
 *  - Never nest glass. The inner surface blurs the outer surface's
 *    already-blurred output: double the cost, and both read as mud.
 *  - Never animate the blur RADIUS , every frame forces a full backdrop
 *    repaint. Animate `opacity` and `transform` instead.
 *
 * ## Two layout behaviours to design around rather than debug later
 *
 *  - `backdrop-filter` establishes a containing block for `position: fixed`
 *    descendants, so a fixed child inside a blurred surface is trapped by it.
 *  - It also forms a stacking context, so `z-index` inside it is scoped to it.
 */
export interface GlassTier {
  /** Surface colour composited over whatever sits behind it. */
  surface: string;
  /** Alpha applied to `surface`. Floored at {@link GLASS_ALPHA_FLOOR}. */
  alpha: number;
  /** `backdrop-filter: blur()` radius. */
  blur: string;
  /** The one sanctioned translucent border in the whole system. */
  border: string;
}

/**
 * Tier S adds the two values Tier O has no use for , an overlay's separation
 * comes from `--shadow-overlay` and its lit edge would be lost against an
 * unknown backdrop, so neither is meaningful there.
 */
export interface GlassSurfaceTier extends GlassTier {
  /**
   * The FAR stop of the directional sheen , `surface` is the near/lit stop.
   *
   * Tier S paints a two-stop gradient rather than a flat fill, so a surface has
   * a direction: lit at the top-left corner, falling away to the bottom-right.
   * Both stops are composited over the page and gated exactly like a flat fill
   * was , see {@link GLASS_SURFACE_PAIRS}, which walks `stops`, not a single
   * colour. That is the whole reason this is a second token and not a
   * `linear-gradient()` string: a gradient baked into one value would be opaque
   * to the perceptibility gate, and the sheen would become an ungated hole in
   * exactly the place the gate exists to protect.
   *
   * ## The measured magnitude, stated plainly
   *
   * **This effect is small, and it cannot be made large.** A Tier-S composite is
   * boxed between the page below and the opaque `--panel` above, and the sheen
   * has to spend that same budget twice , once per stop. The shipped separation
   * is **3/255 in light and 4/255 in dark**:
   *
   *   light  top #FAF8F6 (Δbg 12, Δpanel  9) → bottom #F7F5F3 (Δbg  9, Δpanel 12)
   *   dark   top #232423 (Δbg 14, Δpanel  9) → bottom #1F201F (Δbg 10, Δpanel 13)
   *
   * A 3-5/255 *step* would be invisible. A ramp of that size across a card is
   * not, because gradient detection runs well below step-edge detection , which
   * is the only reason this is worth a token at all. Do not expect it to carry a
   * surface on its own: in light the material is still tint + edge + shadow, and
   * in dark it is still the specular highlight.
   *
   * Light's bottom stop used to sit **exactly on** {@link PERCEPTIBILITY_FLOOR}.
   * De-pinking the ramp bought it one step of margin (9/255), because the tier
   * stopped depending on a blue-channel chroma difference and started being
   * separated by lightness. It is still the tightest number in the file, and if
   * `--bg` or `--panel` ever move the gate is supposed to fail loudly rather than
   * let the bottom of every card quietly merge into the page.
   */
  surfaceBottom: string;
  /**
   * Top-edge specular highlight, applied as an INSET box-shadow so it follows
   * the border radius without a pseudo-element. `transparent` in light mode,
   * where the same white measures 1.03:1 at {@link GLASS_SPECULAR_ALPHA} , a
   * repaint for nothing, at that alpha or any other.
   */
  highlight: string;
  /**
   * Bottom-weighted drop shadow. **Never `none`**, in either theme:
   * `.glass-surface` composes this into a box-shadow LIST with `highlight`, and
   * `none` inside a comma-separated list invalidates the whole declaration ,
   * taking the specular highlight, i.e. dark mode's material, with it. An
   * absent shadow is spelled `0 0 0 transparent`. Both themes ship a real
   * shadow today, so nothing relies on that spelling, but the hazard is
   * permanent and `tokens-css.test.ts` asserts against `none`.
   */
  shadow: string;
}

/**
 * The measured floor for body text on glass over the worst backdrop in the
 * palette. Below this, a light glass over the lime brand fill stops clearing AA.
 * Asserted in `test/contrast.test.ts`, so lowering an alpha fails CI.
 */
export const GLASS_ALPHA_FLOOR = 0.72;

/**
 * The alpha of the white top-edge specular highlight. One number, both themes,
 * and the whole asymmetry lives in what it measures: **5.05:1** over the dark
 * Tier-S composite (#212221) and **1.03:1** over the light one (#FAF8F6). Light
 * mode therefore sets `highlight` to `transparent` instead of using it.
 *
 * Raised 0.35 → 0.50 on 2026-08-06. The light figure barely moves (1.02 → 1.03)
 * because you cannot lighten a near-white surface with white at any alpha ,
 * which is precisely why raising this is free, and why the asymmetry survives.
 */
export const GLASS_SPECULAR_ALPHA = 0.5;

export const glass = {
  light: {
    surface: '#FFFFFF',
    alpha: 0.85,
    blur: '16px',
    border: 'rgba(42, 43, 42, 0.10)',
  },
  /**
   * Tier O, dark. **#1E1F1E is a literal on purpose , it must NOT be
   * `neutral[900]`.**
   *
   * It was `neutral[900]`, which is also what `--bg` was, so a Popover or
   * DropdownMenu composited to *exactly* the page colour: **0/255**, separated
   * only by a 1.33:1 border. A Dialog got away with it because the `--overlay`
   * scrim darkens its backdrop first; the unscrimmed overlays did not. The
   * perceptibility gate never caught it because it only covered Tier S , it now
   * covers both tiers, which is the assertion that keeps this value honest.
   *
   * At α 0.85 this composites 8/255 off the page, and against the worst of the
   * seven {@link worstCaseBackdrops} still holds fg 5.53:1 and
   * `--muted-on-glass` 4.89:1. Lifting it further is possible but not free:
   * `neutral[800]` would reach 20/255 and drop muted-on-glass to 4.20:1, below
   * AA.
   */
  dark: {
    surface: '#1E1F1E',
    alpha: 0.85,
    blur: '16px',
    border: 'rgba(242, 235, 232, 0.12)',
  },
  /**
   * The elevated dark tier , a plum-tinted glass for surfaces stacked above an
   * already-dark overlay. Runs at a higher alpha because plum is a chromatic
   * tint: at 0.85 the composite over a lime backdrop drifts visibly green.
   */
  darkElevated: {
    surface: seed.plum,
    alpha: 0.9,
    blur: '16px',
    border: 'rgba(242, 235, 232, 0.14)',
  },

  /**
   * Tier S, light. #FCFAF8 is `oklch(0.9855 0.0035 74)` , the neutral ramp's own
   * hue and chroma, one notch above `neutral-50` (L 0.9747). The composite has to
   * sit ABOVE the page to read as raised, and pure white is 3/255 from the panel,
   * so up-the-ramp is the only direction available.
   *
   * Composites to **#FAF8F6** over the page: 12/255 from `--bg`, 9/255 from
   * `--panel` , both clear of the 8/255 gate, and lighter than the page on all
   * three channels. fg 12.94:1, `--muted-fg` 5.53:1, so no `--muted-on-glass` on
   * this tier.
   *
   * ## Why this moved DOWN when the palette was de-pinked
   *
   * The old pair (#FFFAF7 / #FDF6F1, at hue 44.9° and chroma 0.0085) got most of
   * its separation from the page's pink cast on the **blue channel**: the
   * perceptibility gate takes the max over channels, so a warm tint over a warmer
   * page passed on blue alone while being nearly identical in luminance. That is a
   * fragile way to be visible , it depends on the page staying pink, and the far
   * stop was sitting exactly ON the 8/255 floor.
   *
   * With the ramp at chroma 0.0045 there is no chroma lever left, so this tier is
   * now separated by LIGHTNESS, which is what "raised" actually means. Lower L
   * than before, and both stops clear the floor by 1–4 steps in both directions.
   *
   * The alpha stays at Tier O's 0.85 deliberately. The alternative that lands on
   * an almost identical composite , `--panel` at α 0.50 , drifts ~11/255 the
   * moment anything but the page sits behind it; the tinted surface at 0.85 drifts
   * 3/255. Tint, not transparency, is what makes Tier S visible.
   */
  surfaceLight: {
    surface: '#FCFAF8',
    // The sheen's far stop. Composites to #F7F5F3: 9/255 from `--bg` and 12/255
    // from `--panel`. The old far stop sat exactly ON the 8/255 floor against the
    // page; this one has a step of margin, which is what the lightness-based
    // separation above bought. Still lighter than the page on all three channels,
    // so the surface reads as raised along its whole height, not just at the top.
    surfaceBottom: '#F8F6F4',
    alpha: 0.85,
    blur: '16px',
    // 1.81:1 over the composite, deliberately FIRMER than what an opaque card
    // shows (`--border` on `--panel`, 1.61:1). The Tier-O border at α 0.10
    // manages 1.21:1 here. The tint is capped by the gate (see the note above),
    // so in light mode the edge and the shadow are the whole re-tune.
    border: 'rgba(42, 43, 42, 0.30)',
    // You cannot lighten white: this same value measures 1.02:1 here at α 0.35
    // and 1.03:1 at α 0.50.
    highlight: 'transparent',
    // Three stops: a 1px contact shadow, a short mid stop for near-field
    // separation, and a long soft stop for the lift. Shadows are the only lever
    // with no contrast ceiling at all , black at α 0.08 already moves the light
    // page 20/255 , and the previous two-stop ramp used a fraction of it.
    shadow:
      '0 1px 2px rgba(42, 43, 42, 0.06), 0 4px 10px -3px rgba(42, 43, 42, 0.10), 0 18px 36px -14px rgba(42, 43, 42, 0.22)',
  },

  /**
   * Tier S, dark. #232423 is on the ramp's axis between the page
   * (`neutral-925`, L 0.1987) and the panel (`neutral-800`, L 0.2958), which is
   * where a surface has to sit to be distinguishable from both.
   *
   * Composites to **#212221** over the page: **12/255 from `--bg` and 11/255
   * from `--panel`**, inside a 23/255 gap.
   * fg 13.55:1, `--muted-fg` 6.34:1.
   *
   * **That gap is the whole budget, and widening it was the 2026-08-06 fix.**
   * It used to be 18/255, which left a legal window of exactly three values and
   * pinned this tier at 9/255 either side , provably visible, and flat. The
   * page dropped one ramp step rather than the panel rising, because `--panel`
   * is pinned twice: at #2E2F2E the gated `primary fill vs panel` pair falls to
   * 2.98:1, and the soft-chip suite fails just past it.
   *
   * Same reasoning as light on the alpha: `--panel` at α 0.50 reaches a similar
   * composite but drifts 31/255 over other backdrops against this tier's 3/255
   * (10/255 over the plum `--elevated`).
   */
  surfaceDark: {
    surface: '#232423',
    /*
     * The sheen's far stop. Composites to #1E1E1E: 9/255 from `--bg`, 15/255
     * from `--panel`, `--muted-fg` 6.62:1 , every figure at or better than the
     * flat fill it replaces.
     *
     * Dark builds its sheen by pushing this stop DOWN rather than pushing
     * `surface` up, and that asymmetry with light is deliberate. Both directions
     * reach the same 4-5/255 separation, but `surface` here was measured and
     * re-tuned on 2026-08-06 against the widened page↔panel budget , its
     * composite (#212221, 12/255 either side) is the value that made a dark card
     * stop reading as flat. Lifting it to buy sheen would spend that gain on the
     * `--panel` wall (Δpanel 11 → 9) to no benefit, because the far stop had the
     * slack all along.
     */
    surfaceBottom: '#1F201F',
    alpha: 0.85,
    blur: '16px',
    // 2.18:1 over the composite, against 1.15:1 for the opaque `--border` on
    // `--panel`. Firmer than a divider on purpose , a card outline is
    // decorative, so 1.4.11 does not cap it and the gate only sets a floor.
    border: 'rgba(242, 235, 232, 0.26)',
    // 5.05:1 over #212221. THE dark-mode material.
    highlight: 'rgba(255, 255, 255, 0.50)',
    // A real shadow since 2026-08-06. Measured, it is a MODEST signal: black at
    // α 0.50 moves the near-black page only ~12/255, which is the honest reason
    // "dark delineates with borders, not shadows" was ever written. It was
    // still wrong , that left a dark card with a 1.50:1 edge, a 3.18:1
    // highlight and 9/255 of tint, three weak signals and no strong one.
    // Not `none` , see {@link GlassSurfaceTier.shadow}.
    shadow: '0 2px 4px rgba(0, 0, 0, 0.40), 0 14px 32px -10px rgba(0, 0, 0, 0.65)',
  },
  // The union, not `Record<string, GlassTier>`: an index signature makes TS
  // excess-property-check every value against GlassTier alone, so `highlight`
  // and `shadow` are rejected outright. The union keeps the guard that every
  // tier must be one of the two shapes.
} as const satisfies Record<string, GlassTier | GlassSurfaceTier>;

export type GlassTierName = keyof typeof glass;

/** The Tier-S tiers, named so the gates can iterate them without a string cast. */
export type GlassSurfaceTierName = 'surfaceLight' | 'surfaceDark';
