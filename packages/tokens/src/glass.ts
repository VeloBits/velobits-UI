import { neutral, seed } from './palette';

/**
 * TWO TIERS, AND THEY ARE NOT THE SAME MATERIAL.
 *
 * **Tier O — overlay.** Surfaces that float over page content: Dialog ·
 * Sheet/SidePanel · Popover · DropdownMenu · CommandPalette · Toast. The
 * backdrop is arbitrary, so every value is measured against all seven
 * {@link worstCaseBackdrops}, and muted text steps up to `--muted-on-glass`.
 * Tiers `light` / `dark` / `darkElevated` below.
 *
 * **Tier S — component surface.** Card · Panel · Table shell · Sidebar · sticky
 * TopBar. The backdrop is KNOWN — it is the page — so the values are measured
 * against exactly one thing and `--muted-fg` is safe on it (5.57:1 in light,
 * 6.19:1 in dark). Tiers `surfaceLight` / `surfaceDark` below.
 *
 * Forbidden on both tiers: page and body backgrounds (nothing behind them to
 * see), and nested glass.
 *
 * ## Tier S cannot be Tier O with a different class name
 *
 * Composited over the flat page, the obvious "panel colour at α 0.85" is a
 * measurable NO-OP:
 *
 *   light  #FFFFFF @0.85 over #F4EDEA → #FDFCFC, **3/255** from opaque #FFFFFF
 *   dark   #2C2D2C @0.85 over #1A1B1A → #292A29, **3/255** from opaque #2C2D2C
 *
 * Three 8-bit steps is below any perceptual threshold, and blurring a uniform
 * page returns that same uniform page — so the browser pays for a backdrop
 * repaint and the user sees an opaque card. The Tier-S surfaces are therefore
 * TINTED off both the page and the panel, and `test/contrast.test.ts` gates the
 * separation at ≥{@link PERCEPTIBILITY_FLOOR}/255 against BOTH.
 *
 * ## The treatment is asymmetric, because light cannot be lightened
 *
 * A white top-edge specular highlight at {@link GLASS_SPECULAR_ALPHA} measures
 * **1.02:1** over the light composite and **3.18:1** over the dark one — the
 * single most important number in this file. It means:
 *
 *   dark   the specular highlight carries the material. It is what reads as
 *          "a lit edge", and it costs nothing.
 *   light  no highlight at all (`transparent`). The material comes from the
 *          tint (#FFFAF7 — neutral-50's own hue and chroma pushed to L 0.99,
 *          the only direction with room left in the gamut), a FIRMER hairline
 *          border (1.60:1, matching the opaque `--border`'s 1.61:1 on `--panel`
 *          where the Tier-O border manages only 1.21:1), and a bottom-weighted
 *          shadow.
 *
 * Do not "fix" the asymmetry by giving light a highlight and dark a shadow. Both
 * are invisible in the theme they are missing from; that is why they are missing.
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
 *  - Never animate the blur RADIUS — every frame forces a full backdrop
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
 * Tier S adds the two values Tier O has no use for — an overlay's separation
 * comes from `--shadow-overlay` and its lit edge would be lost against an
 * unknown backdrop, so neither is meaningful there.
 */
export interface GlassSurfaceTier extends GlassTier {
  /**
   * Top-edge specular highlight, applied as an INSET box-shadow so it follows
   * the border radius without a pseudo-element. `transparent` in light mode,
   * where the same white at α 0.35 measures 1.02:1 — a repaint for nothing.
   */
  highlight: string;
  /**
   * Bottom-weighted drop shadow. `0 0 0 transparent` in dark mode rather than
   * `none`: `.glass-surface` composes this into a box-shadow LIST with
   * `highlight`, and `none` inside a comma-separated list invalidates the whole
   * declaration. Same nothing, in a form that can sit in a list.
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
 * and the whole asymmetry lives in what it measures: 3.18:1 over the dark Tier-S
 * composite (#232423) and 1.02:1 over the light one (#FDF8F5). Light mode
 * therefore sets `highlight` to `transparent` instead of using it.
 */
export const GLASS_SPECULAR_ALPHA = 0.35;

export const glass = {
  light: {
    surface: '#FFFFFF',
    alpha: 0.85,
    blur: '16px',
    border: 'rgba(42, 43, 42, 0.10)',
  },
  dark: {
    surface: neutral[900],
    alpha: 0.85,
    blur: '16px',
    border: 'rgba(242, 235, 232, 0.12)',
  },
  /**
   * The elevated dark tier — a plum-tinted glass for surfaces stacked above an
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
   * Tier S, light. #FFFAF7 is `oklch(0.99 0.0085 44.9)` — neutral-50's exact
   * hue and chroma with lightness raised from 0.9747 to 0.99, i.e. one notch
   * further up the ramp's own warm axis than the ramp itself goes. That
   * direction is the only one available: the composite has to sit ABOVE the
   * cream page to read as raised, and pure white is 3/255 from the panel.
   *
   * Composites to **#FDF8F5** over the page: 11/255 from `--bg`, 10/255 from
   * `--panel` — both clear of the 8/255 gate, and lighter than the page on all
   * three channels. fg 13.48:1, `--muted-fg` 5.57:1, so no `--muted-on-glass`
   * on this tier.
   *
   * The alpha stays at Tier O's 0.85 deliberately. The alternative that lands
   * on an almost identical composite — `--panel` at α 0.50 → #FAF6F4 — drifts
   * 11/255 the moment anything but the page sits behind it; the tinted surface
   * at 0.85 drifts 3/255. Tint, not transparency, is what makes Tier S visible.
   */
  surfaceLight: {
    surface: '#FFFAF7',
    alpha: 0.85,
    blur: '16px',
    // 1.60:1 over the composite. The Tier-O border at α 0.10 manages 1.21:1 and
    // the opaque `--border` dropped onto the same glass only 1.53:1 — in light
    // mode the edge is most of the material, so it is tuned to match what an
    // opaque card already shows (`--border` on `--panel`, 1.61:1).
    border: 'rgba(42, 43, 42, 0.24)',
    // You cannot lighten white: this same value at α 0.35 measures 1.02:1 here.
    highlight: 'transparent',
    shadow: '0 1px 2px rgba(42, 43, 42, 0.05), 0 8px 16px -6px rgba(42, 43, 42, 0.14)',
  },

  /**
   * Tier S, dark. #252625 is `mix(neutral-900 → neutral-800, 0.6)` —
   * `oklch(0.2672 0.0023 145.5)`, on the ramp's axis between the page (0.2206)
   * and the panel (0.2958), which is where a surface has to sit to be
   * distinguishable from both.
   *
   * Composites to **#232423** over the page: 9/255 from `--bg` AND 9/255 from
   * `--panel`, the balanced midpoint of an 18/255 gap — that gap is the whole
   * budget dark mode has, which is why this tier has the least room of the four
   * and why widening the page/panel distance would be the fix if it ever fails.
   * fg 13.22:1, `--muted-fg` 6.19:1.
   *
   * Same reasoning as light on the alpha: `--panel` at α 0.50 reaches the same
   * #232423 but drifts 31/255 over other backdrops against this tier's 3/255
   * (10/255 over the plum `--elevated`).
   */
  surfaceDark: {
    surface: '#252625',
    alpha: 0.85,
    blur: '16px',
    // 1.50:1 over the composite, against 1.15:1 for the opaque `--border` on
    // `--panel`. Firmer than a divider, but the highlight below is what
    // actually carries this theme.
    border: 'rgba(242, 235, 232, 0.14)',
    // 3.18:1 over #232423. THE dark-mode material.
    highlight: 'rgba(255, 255, 255, 0.35)',
    // Dark delineates with borders and the lit edge, not shadows (ADR-0024).
    // Not `none` — see {@link GlassSurfaceTier.shadow}.
    shadow: '0 0 0 transparent',
  },
  // The union, not `Record<string, GlassTier>`: an index signature makes TS
  // excess-property-check every value against GlassTier alone, so `highlight`
  // and `shadow` are rejected outright. The union keeps the guard that every
  // tier must be one of the two shapes.
} as const satisfies Record<string, GlassTier | GlassSurfaceTier>;

export type GlassTierName = keyof typeof glass;

/** The Tier-S tiers, named so the gates can iterate them without a string cast. */
export type GlassSurfaceTierName = 'surfaceLight' | 'surfaceDark';
