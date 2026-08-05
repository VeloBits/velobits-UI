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
  ring: seed.blue,
  highlight: 'rgba(42, 43, 42, 0.05)',
  overlay: 'rgba(26, 27, 26, 0.45)',
  // #2B762D, not a lighter green: the obvious `#2F7D31` measures 4.86:1 on
  // white but only 4.43:1 on cream, and cream is the page. Anything tuned
  // against a white panel has to be re-checked against the warm background.
  success: '#2B762D',
  successSoft: 'rgba(43, 118, 45, 0.12)',
  danger: '#C0322B',
  dangerSoft: 'rgba(192, 50, 43, 0.10)',
  warning: '#8A5B00',
  warningSoft: 'rgba(138, 91, 0, 0.12)',
  info: blueSteps.text,
  infoSoft: 'rgba(0, 108, 189, 0.10)',
  chart1: '#1D82D2',
  chart2: '#6F8714',
  chart3: '#BC5F8D',
  chart4: '#AF7011',
  chart5: '#368A8A',
};

export const dark: SemanticTokens = {
  bg: neutral[900],
  bg2: neutral[800],
  panel: neutral[800],
  // Plum, not a lighter grey: its OKLCH lightness (0.355) is above charcoal's
  // (0.288), so it reads as elevation while staying unmistakably branded.
  elevated: seed.plum,
  fg: neutral[100],
  mutedFg: neutral[400],
  mutedOnGlass: neutral[200],
  // neutral-750 exists for this token. The value inherited from ToggleFlow
  // (#2E2E2E) was tuned against its darker #252526 panel; against this
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
  ring: blueSteps.ringDark,
  highlight: 'rgba(242, 235, 232, 0.06)',
  overlay: 'rgba(14, 15, 14, 0.60)',
  success: '#7FB86B',
  successSoft: 'rgba(127, 184, 107, 0.16)',
  danger: '#F1706B',
  dangerSoft: 'rgba(241, 112, 107, 0.16)',
  warning: '#E0C060',
  warningSoft: 'rgba(224, 192, 96, 0.16)',
  info: blueSteps.textDark,
  infoSoft: 'rgba(66, 164, 249, 0.16)',
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
