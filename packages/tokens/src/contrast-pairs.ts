import { compositeOver } from './color';
import { glass, type GlassSurfaceTierName } from './glass';
import type { SemanticTokens, ThemeName } from './semantic';
import { themes } from './semantic';

/**
 * Every documented semantic pairing, as data. `test/contrast.test.ts` walks
 * this registry and asserts each pair meets its WCAG target in both themes, so
 * a future palette edit that breaks contrast fails CI instead of shipping.
 *
 * Adding a semantic colour token without adding it here is the one way to get
 * an unmeasured colour into the system — `test/contrast.test.ts` also asserts
 * that every colour-valued key of {@link SemanticTokens} appears in at least
 * one pair, which closes that hole.
 */

/** WCAG success criteria this system holds itself to. */
export const TARGET = {
  /** 1.4.3 Contrast (Minimum) — body text. */
  text: 4.5,
  /** 1.4.3 — text ≥18.66px bold or ≥24px. Used only where a token is large-text-only by contract. */
  largeText: 3,
  /** 1.4.11 Non-text Contrast — anything required to identify a component or its state. */
  nonText: 3,
} as const;

export type ContrastTarget = keyof typeof TARGET;

export interface ContrastPair {
  /** Human-readable, and what the failure message prints. */
  label: string;
  /** Foreground/subject token. */
  fg: keyof SemanticTokens;
  /** Backdrop token. */
  bg: keyof SemanticTokens;
  target: ContrastTarget;
  /** Restrict to one theme when the pairing only exists there. */
  only?: ThemeName;
  /** Why this pair is exempt or special-cased — printed in the test name. */
  note?: string;
}

export const CONTRAST_PAIRS: readonly ContrastPair[] = [
  /* ── body and secondary text on every surface ─────────────────────────── */
  { label: 'body text on page', fg: 'fg', bg: 'bg', target: 'text' },
  { label: 'body text on panel', fg: 'fg', bg: 'panel', target: 'text' },
  { label: 'body text on recessed surface', fg: 'fg', bg: 'bg2', target: 'text' },
  { label: 'body text on elevated surface', fg: 'fg', bg: 'elevated', target: 'text' },
  { label: 'muted text on page', fg: 'mutedFg', bg: 'bg', target: 'text' },
  { label: 'muted text on panel', fg: 'mutedFg', bg: 'panel', target: 'text' },
  { label: 'muted text on recessed surface', fg: 'mutedFg', bg: 'bg2', target: 'text' },

  /* ── the blue asymmetry, which is the palette's sharpest edge ─────────── */
  {
    label: 'link / primary-text on page',
    fg: 'primaryText',
    bg: 'bg',
    target: 'text',
    note: 'the reason --primary is not a text token: the seed itself is 3.90:1 on cream',
  },
  { label: 'link / primary-text on panel', fg: 'primaryText', bg: 'panel', target: 'text' },
  { label: 'on-primary over a primary fill', fg: 'onPrimary', bg: 'primary', target: 'text' },
  { label: 'primary fill vs page', fg: 'primary', bg: 'bg', target: 'nonText' },
  { label: 'primary fill vs panel', fg: 'primary', bg: 'panel', target: 'nonText' },

  /* ── lime: fill-only in light, text-safe in dark ──────────────────────── */
  {
    label: 'on-brand over a brand fill',
    fg: 'onBrand',
    bg: 'brand',
    target: 'text',
    note: 'charcoal on lime, 10.89:1 — the ONLY sanctioned lime pairing. White on lime is 1.31:1.',
  },
  {
    label: 'brand fill vs page',
    fg: 'brand',
    bg: 'bg',
    target: 'nonText',
    only: 'dark',
    note:
      'dark only, and that is the palette speaking rather than a concession. Lime on cream is ' +
      '1.13:1, so a lime fill CANNOT carry a 3:1 boundary in light mode. That is fine for a ' +
      'badge or a button, where high-contrast text inside identifies the element — and NOT fine ' +
      'for a lone graphical indicator (a status dot, an indicator bar, an unlabelled chart mark), ' +
      'which needs an outline or a darker companion in light mode. Asserted below.',
  },
  {
    label: 'brand as text on page',
    fg: 'accentText',
    bg: 'bg',
    target: 'text',
    only: 'dark',
    note: 'lime is a valid text accent in dark mode (13.24:1); in light mode the same role is plum',
  },
  {
    label: 'plum text accent on page',
    fg: 'accentText',
    bg: 'bg',
    target: 'text',
    only: 'light',
  },

  /* ── the terminal surface ─────────────────────────────────────────────── */
  {
    label: 'on-code over a code fill',
    fg: 'onCode',
    bg: 'code',
    target: 'text',
    note:
      'measured once and it holds for BOTH themes, because the pair is theme-invariant by ' +
      'design — see semantic.ts. A revealed secret has to be transcribable, and this is the ' +
      'only text in the product where a single wrong character is unrecoverable.',
  },

  /* ── focus and control affordances (1.4.11) ───────────────────────────── */
  { label: 'focus ring vs page', fg: 'ring', bg: 'bg', target: 'nonText' },
  { label: 'focus ring vs panel', fg: 'ring', bg: 'panel', target: 'nonText' },
  {
    label: 'field border vs panel',
    fg: 'fieldBorder',
    bg: 'panel',
    target: 'nonText',
    note: 'identifies an input, so 1.4.11 applies — unlike --border, which is decorative',
  },
  { label: 'field border vs page', fg: 'fieldBorder', bg: 'bg', target: 'nonText' },

  /* ── status colours, as text and as fills ─────────────────────────────── */
  { label: 'success text on page', fg: 'success', bg: 'bg', target: 'text' },
  { label: 'success text on panel', fg: 'success', bg: 'panel', target: 'text' },
  { label: 'danger text on page', fg: 'danger', bg: 'bg', target: 'text' },
  { label: 'danger text on panel', fg: 'danger', bg: 'panel', target: 'text' },
  { label: 'warning text on page', fg: 'warning', bg: 'bg', target: 'text' },
  { label: 'warning text on panel', fg: 'warning', bg: 'panel', target: 'text' },
  { label: 'info text on page', fg: 'info', bg: 'bg', target: 'text' },
  { label: 'info text on panel', fg: 'info', bg: 'panel', target: 'text' },

  /* ── chart series vs the page they are drawn on ───────────────────────────
   * `nonText`, because a series mark is a graphical object, not text. Note this
   * gate is necessary but NOT sufficient: the five hues are isoluminant, so
   * they pass here while remaining indistinguishable from one another in
   * greyscale. WCAG 1.4.1 still requires shape, pattern or a direct label. */
  { label: 'chart series 1 vs page', fg: 'chart1', bg: 'bg', target: 'nonText' },
  { label: 'chart series 2 vs page', fg: 'chart2', bg: 'bg', target: 'nonText' },
  { label: 'chart series 3 vs page', fg: 'chart3', bg: 'bg', target: 'nonText' },
  { label: 'chart series 4 vs page', fg: 'chart4', bg: 'bg', target: 'nonText' },
  { label: 'chart series 5 vs page', fg: 'chart5', bg: 'bg', target: 'nonText' },
];

/**
 * Tokens deliberately NOT contrast-gated, with the reason. The test asserts
 * this list plus {@link CONTRAST_PAIRS} covers every semantic token, so a new
 * colour has to be either measured or explicitly excused here.
 */
export const CONTRAST_EXEMPT: Readonly<Record<string, string>> = {
  bg: 'a backdrop, always measured as the `bg` side of a pair',
  bg2: 'a backdrop',
  panel: 'a backdrop',
  elevated: 'a backdrop',
  code: 'a backdrop, measured as the `bg` side of the on-code pair',
  border:
    'decorative separators only (table rules, card outlines). WCAG 1.4.11 applies to visuals REQUIRED to identify a component — a divider is not one. Control edges use fieldBorder, which IS gated.',
  primaryHover:
    'a hover state of an already-gated fill; 1.4.11 exempts states reachable only by pointer hover where the base state is conformant',
  primarySoft: 'gated by the soft-chip composite suite, not by a flat pair',
  brandSoft:
    'translucent wash with no text-on-wash pairing: Badge deliberately has no soft-lime-with-lime-text variant (lime on cream is 1.13:1), so there is nothing to composite',
  successSoft: 'gated by the soft-chip composite suite, not by a flat pair',
  dangerSoft: 'gated by the soft-chip composite suite, not by a flat pair',
  warningSoft: 'gated by the soft-chip composite suite, not by a flat pair',
  infoSoft: 'gated by the soft-chip composite suite, not by a flat pair',
  highlight: 'translucent hover wash on an otherwise transparent control',
  overlay: 'a scrim; its job is to reduce contrast behind a modal',
  mutedOnGlass: 'gated by the glass composite suite, not by a flat pair',
};

/** Resolve a pair against a theme. Returns null when the pair is theme-scoped elsewhere. */
export function resolvePair(
  pair: ContrastPair,
  theme: ThemeName,
): { fg: string; bg: string; target: number } | null {
  if (pair.only && pair.only !== theme) return null;
  return {
    fg: themes[theme][pair.fg],
    bg: themes[theme][pair.bg],
    target: TARGET[pair.target],
  };
}

/* ── tier S: the glass that IS the component surface ──────────────────────── */

/**
 * The minimum 8-bit channel separation a tier-S composite must hold against
 * BOTH `--panel` and `--bg`.
 *
 * This is not a WCAG number — nothing in WCAG cares whether a card looks like
 * glass. It is the gate that stops the retrofit from silently becoming a no-op:
 * the naive "panel colour at α 0.85" composites to within **3/255** of the
 * opaque panel in both themes, and blurring a uniform page returns the same
 * uniform page, so the browser pays for a backdrop repaint and the user sees no
 * difference at all. 8/255 is roughly where a flat-colour edge becomes visible
 * on a calibrated display, and it is comfortably clear of the 3/255 failure.
 *
 * Nothing in the WCAG pair sweep would ever have caught this — an invisible
 * glass card has *better* contrast than a visible one.
 */
export const PERCEPTIBILITY_FLOOR = 8;

/**
 * The tier-S measurements, as data, in the same spirit as {@link CONTRAST_PAIRS}.
 *
 * Tier O is NOT here and should not be moved here: an overlay's backdrop is
 * arbitrary, so it is swept across `worstCaseBackdrops` in the glass suite of
 * `test/contrast.test.ts` instead. Tier S has exactly one backdrop — the page
 * — which is what makes a single composite per theme the whole measurement.
 */
export interface GlassSurfacePair {
  /** Human-readable, and what the failure message prints. */
  label: string;
  theme: ThemeName;
  tier: GlassSurfaceTierName;
}

export const GLASS_SURFACE_PAIRS: readonly GlassSurfacePair[] = [
  { label: 'light component surface (Card, Panel, Sidebar)', theme: 'light', tier: 'surfaceLight' },
  { label: 'dark component surface (Card, Panel, Sidebar)', theme: 'dark', tier: 'surfaceDark' },
];

/**
 * Flatten a tier-S entry into the opaque colours the gates measure.
 *
 * `compositeOver` blends in GAMMA-ENCODED sRGB, which is what browsers do for
 * `rgba()`. Measuring these in linear light reports every composite several 8-bit
 * steps lighter and would report the perceptibility gate as passing on values
 * that are invisible in a browser — see the note on `compositeOver`.
 */
export function resolveGlassSurface(pair: GlassSurfacePair): {
  /** The tier-S surface flattened over the page: the colour text actually sits on. */
  composite: string;
  /** The opaque panel this tier has to look different from. */
  panel: string;
  /** The page it has to look different from in the other direction. */
  bg: string;
  fg: string;
  mutedFg: string;
} {
  const theme = themes[pair.theme];
  const tier = glass[pair.tier];
  return {
    composite: compositeOver(tier.surface, theme.bg, tier.alpha),
    panel: theme.panel,
    bg: theme.bg,
    fg: theme.fg,
    mutedFg: theme.mutedFg,
  };
}

/* ── the soft chips: text over a translucent wash over a surface ───────────── */

/**
 * Badge's `*-soft` variants pair a translucent wash with the matching TEXT
 * token — `bg-success-soft text-success` — and `StatusChip` composes those same
 * variants. Chip text is 12px, so WCAG 1.4.3's full 4.5:1 applies, and the
 * colour the text actually sits on is not the wash: it is the wash FLATTENED
 * over whatever surface the chip is placed on. A wash at α 0.10–0.12 barely
 * moves the backdrop, which is exactly the problem — the composite inherits the
 * backdrop's luminance, and the page is the worst case in light mode (cream is
 * darker than the white panel) while the panel is the worst case in dark
 * (lighter than the page).
 *
 * Each pairing is therefore measured over THREE backdrops in both themes: the
 * page, the panel, and the tier-S glass composite (a chip inside a Card). Same
 * registry-as-data spirit as {@link CONTRAST_PAIRS} and
 * {@link GLASS_SURFACE_PAIRS}; the assertions live in `test/contrast.test.ts`.
 *
 * `brandSoft` is deliberately absent: there is no soft-lime-with-lime-text
 * Badge variant, because lime on cream is 1.13:1 — see {@link CONTRAST_EXEMPT}.
 */
export interface SoftChipPair {
  /** Human-readable, and what the failure message prints. */
  label: string;
  /** The text token the chip pairs with the wash. */
  fg: keyof SemanticTokens;
  /** The translucent wash behind it. */
  wash: keyof SemanticTokens;
}

export const SOFT_CHIP_PAIRS: readonly SoftChipPair[] = [
  { label: 'primary soft chip (Badge `primary`)', fg: 'primaryText', wash: 'primarySoft' },
  { label: 'success soft chip (Badge `success`)', fg: 'success', wash: 'successSoft' },
  { label: 'danger soft chip (Badge `danger`)', fg: 'danger', wash: 'dangerSoft' },
  { label: 'warning soft chip (Badge `warning`)', fg: 'warning', wash: 'warningSoft' },
  { label: 'info soft chip (Badge `info`)', fg: 'info', wash: 'infoSoft' },
];

/** The surfaces a chip plausibly sits on, resolved per theme. */
export type SoftChipBackdropName = 'page' | 'panel' | 'glass surface';

/** Parse `rgba(r, g, b, a)` — the only translucent spelling these tokens use. */
function parseRgba(css: string): { hex: string; alpha: number } {
  const m = /^rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)$/.exec(css);
  if (!m) throw new Error(`Not an rgba() colour: ${css}`);
  const hex =
    '#' +
    [1, 2, 3]
      .map((i) => Number(m[i]).toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
  return { hex, alpha: Number(m[4]!) };
}

/**
 * Flatten a soft-chip entry into the opaque colours the gate measures: the
 * wash composited over each backdrop, in GAMMA-encoded sRGB like everything
 * else in this file — see the note on `compositeOver`. The glass backdrop is
 * itself a composite (the tier-S surface flattened over the page, i.e. the
 * same colour {@link resolveGlassSurface} reports), so a chip in a Card is a
 * wash-over-glass-over-page stack, flattened in order.
 */
export function resolveSoftChip(
  pair: SoftChipPair,
  theme: ThemeName,
): {
  fg: string;
  /** The opaque colour the chip text actually sits on, per backdrop. */
  backdrops: { name: SoftChipBackdropName; composite: string }[];
} {
  const t = themes[theme];
  const tier = glass[theme === 'light' ? 'surfaceLight' : 'surfaceDark'];
  const wash = parseRgba(t[pair.wash]);
  const flatten = (backdrop: string) => compositeOver(wash.hex, backdrop, wash.alpha);
  return {
    fg: t[pair.fg],
    backdrops: [
      { name: 'page', composite: flatten(t.bg) },
      { name: 'panel', composite: flatten(t.panel) },
      { name: 'glass surface', composite: flatten(compositeOver(tier.surface, t.bg, tier.alpha)) },
    ],
  };
}
