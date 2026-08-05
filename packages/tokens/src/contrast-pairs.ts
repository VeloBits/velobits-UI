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
  border:
    'decorative separators only (table rules, card outlines). WCAG 1.4.11 applies to visuals REQUIRED to identify a component — a divider is not one. Control edges use fieldBorder, which IS gated.',
  primaryHover:
    'a hover state of an already-gated fill; 1.4.11 exempts states reachable only by pointer hover where the base state is conformant',
  primarySoft: 'translucent wash behind gated text; measured as a composite in the glass suite',
  brandSoft: 'translucent wash',
  successSoft: 'translucent wash',
  dangerSoft: 'translucent wash',
  warningSoft: 'translucent wash',
  infoSoft: 'translucent wash',
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
