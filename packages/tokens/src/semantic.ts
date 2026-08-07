import { blueSteps, neutral, plumSteps, seed } from './palette';

/**
 * The semantic layer: the names components actually consume, resolved per
 * theme. This object and `css/tokens.css` describe the same values — the test
 * suite parses the CSS and asserts they agree, so the two cannot drift.
 */
export interface SemanticTokens {
  /** Page background. */
  bg: string;
  /** Recessed background — table headers, inset wells, secondary surfaces. */
  bg2: string;
  /** Card / panel / popover surface. */
  panel: string;
  /** Raised above `panel`. Dark mode tints with plum, which is *lighter* than charcoal in OKLCH and so reads as elevation. */
  elevated: string;
  /** Body text. */
  fg: string;
  /** Secondary text. Meets AA against `bg` and `panel`, not against glass — use `mutedOnGlass` there. */
  mutedFg: string;
  /** Secondary text when it sits on a glass surface. */
  mutedOnGlass: string;
  /** Structural separators: table rules, card outlines, sidebar edges. Decorative, so exempt from WCAG 1.4.11. */
  border: string;
  /** The edge of an interactive control. Identifies the component, so it MUST meet 1.4.11's 3:1. */
  fieldBorder: string;
  /** Brand blue as a fill. Never as text. */
  primary: string;
  primaryHover: string;
  /** Text/icons on a `primary` fill. */
  onPrimary: string;
  /** Brand blue as text: links, inline icons, active nav labels. */
  primaryText: string;
  /** Tinted blue wash for selected rows and soft badges. */
  primarySoft: string;
  /** Brand lime as a fill. */
  brand: string;
  /** Text/icons on a `brand` fill — charcoal, at 10.89:1. White on lime is 1.31:1 and is never correct. */
  onBrand: string;
  /** Tinted lime wash. */
  brandSoft: string;
  /** Plum text accent (light) / plum elevated tint (dark). */
  accentText: string;
  /**
   * The terminal surface: a `CodeBlock` in its `terminal` variant, which is what
   * a one-time secret is shown on.
   *
   * **Identical in both themes, deliberately.** Everything else in this object
   * flips; this pair does not, and that is the point. A revealed API key is the
   * one string in the product that must be transcribed *exactly*, and a surface
   * that changes colour with the theme changes which characters are easiest to
   * misread. Pinning it also makes the block unmistakably "not part of the page"
   * in light mode, which is the visual cue that this content is different in
   * kind.
   */
  code: string;
  /** Text on a `code` fill — 12.95:1. */
  onCode: string;
  /** Focus ring. */
  ring: string;
  /** Hover wash on an otherwise transparent control. */
  highlight: string;
  /** Modal scrim. */
  overlay: string;
  /** Semantic status colours. `*Soft` is the tinted background of the matching chip. */
  success: string;
  successSoft: string;
  danger: string;
  dangerSoft: string;
  warning: string;
  warningSoft: string;
  info: string;
  infoSoft: string;
  /**
   * Chart series. Isoluminant by construction — every entry clears the non-text
   * floor against its theme's page, but they differ in hue rather than
   * lightness, so they are indistinguishable in greyscale. A chart using these
   * must ALSO encode series by shape, pattern or direct label; colour alone
   * fails WCAG 1.4.1 (Use of Color).
   */
  chart1: string;
  chart2: string;
  chart3: string;
  chart4: string;
  chart5: string;
}

export const light: SemanticTokens = {
  bg: seed.cream,
  bg2: neutral[100],
  panel: '#FFFFFF',
  elevated: '#FFFFFF',
  fg: seed.charcoal,
  mutedFg: neutral[600],
  mutedOnGlass: neutral[700],
  border: neutral[300],
  // neutral-500 is the ONLY ramp step that clears 3:1 against both this theme's
  // surfaces AND the dark theme's, which is why one value serves both. The
  // lighter neutral-400 measures 2.52:1 on white and fails.
  fieldBorder: neutral[500],
  primary: seed.blue,
  primaryHover: blueSteps.hover,
  onPrimary: '#FFFFFF',
  primaryText: blueSteps.text,
  primarySoft: 'rgba(0, 122, 204, 0.10)',
  brand: seed.lime,
  onBrand: seed.charcoal,
  brandSoft: 'rgba(200, 241, 53, 0.18)',
  accentText: plumSteps.text,
  code: '#101828',
  onCode: '#7DF3B1',
  ring: seed.blue,
  highlight: 'rgba(42, 43, 42, 0.05)',
  overlay: 'rgba(26, 27, 26, 0.45)',
  // The status text steps are tuned against the WORST composite they sit on,
  // not against the page: a soft chip (`bg-*-soft text-*`) flattens its wash
  // over the cream page, and 12px chip text holds the 4.5:1 target there —
  // the soft-chip suite in `test/contrast.test.ts`. That is why `success` is
  // #226E25 and not the flat-pair-sufficient #2B762D (4.16:1 inside the chip),
  // and the same one-step darkening applies to `danger` and `warning`. Each
  // `*Soft` wash restates its text token's rgb at a fixed alpha.
  success: '#226E25',
  successSoft: 'rgba(34, 110, 37, 0.12)',
  danger: '#B82A24',
  dangerSoft: 'rgba(184, 42, 36, 0.10)',
  warning: '#855600',
  warningSoft: 'rgba(133, 86, 0, 0.12)',
  info: blueSteps.text,
  infoSoft: 'rgba(0, 98, 179, 0.10)',
  chart1: '#1D82D2',
  chart2: '#6F8714',
  chart3: '#BC5F8D',
  chart4: '#AF7011',
  chart5: '#368A8A',
};

export const dark: SemanticTokens = {
  // neutral-925 exists for this token, the same way 750 exists for the dark
  // border. A tier-S surface must clear 8/255 from the page AND from `panel`,
  // so the page↔panel distance is its whole budget; with the page at 900 that
  // was 18/255 and the glass was pinned at 9/255 either side. `panel` cannot
  // move up to widen it (at #2E2F2E the gated `primary fill vs panel` pair
  // falls to 2.98:1), so the page moved down — the free direction, since every
  // dark pair measured against the page is light-on-dark and only improves.
  bg: neutral[925],
  bg2: neutral[800],
  panel: neutral[800],
  // Plum, not a lighter grey: its OKLCH lightness (0.355) is above charcoal's
  // (0.288), so it reads as elevation while staying unmistakably branded.
  elevated: seed.plum,
  fg: neutral[100],
  mutedFg: neutral[400],
  mutedOnGlass: neutral[200],
  // neutral-750 exists for this token. The value inherited from the dashboard
  // app (#2E2E2E) was tuned against its darker #252526 panel; against this
  // palette's #2C2D2C it lands at 1.02:1 — an invisible border.
  border: neutral[750],
  fieldBorder: neutral[500],
  primary: seed.blue,
  primaryHover: blueSteps.hoverDark,
  onPrimary: '#FFFFFF',
  primaryText: blueSteps.textDark,
  primarySoft: 'rgba(0, 122, 204, 0.22)',
  brand: seed.lime,
  onBrand: seed.charcoal,
  brandSoft: 'rgba(200, 241, 53, 0.16)',
  // Lime IS a valid text accent in dark mode (13.24:1 on the page). In light
  // mode the same token as text measures 1.13:1 — hence the asymmetry.
  accentText: seed.lime,
  // Same values as light — see the docblock on `code`. Restated rather than
  // omitted: a token declared only for light inherits the light value into dark,
  // which works by accident here and would stop working the day someone edits
  // one half. The CSS parity test requires both blocks to declare it anyway.
  code: '#101828',
  onCode: '#7DF3B1',
  ring: blueSteps.ringDark,
  highlight: 'rgba(242, 235, 232, 0.06)',
  overlay: 'rgba(14, 15, 14, 0.60)',
  // The four status washes run THINNER than light mode's story would suggest
  // (0.12, down from 0.16): in dark mode a wash LIGHTENS its backdrop, and the
  // soft-chip composite over the panel is where these pairs bottom out — the
  // soft-chip suite in `test/contrast.test.ts`. `danger` moved lighter than the
  // inherited #F1706B for the same reason (3.77:1 inside the chip on the
  // panel); `success` and `warning` cleared the gate on the thinner wash alone.
  success: '#7FB86B',
  successSoft: 'rgba(127, 184, 107, 0.12)',
  danger: '#FF7F79',
  dangerSoft: 'rgba(255, 127, 121, 0.12)',
  warning: '#E0C060',
  warningSoft: 'rgba(224, 192, 96, 0.12)',
  info: blueSteps.textDark,
  infoSoft: 'rgba(74, 172, 255, 0.12)',
  // Lifted relative to light so each series clears 4.5:1 against the darker
  // page instead of resting on the 3:1 floor.
  chart1: '#2387D7',
  chart2: '#738C1B',
  chart3: '#C06492',
  chart4: '#B37519',
  chart5: '#3B8F8E',
};

export const themes = { light, dark } as const;
export type ThemeName = keyof typeof themes;
