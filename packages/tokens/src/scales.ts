/**
 * The static scales , everything that is not a colour and therefore not
 * theme-dependent. These live in `@theme` (not `@theme inline`) on the CSS side.
 */

/** 4px grid. Both existing apps already agree on this, so it is a formalisation, not a change. */
export const spacing = {
  0: '0px',
  px: '1px',
  0.5: '2px',
  1: '4px',
  1.5: '6px',
  2: '8px',
  2.5: '10px',
  3: '12px',
  4: '16px',
  5: '20px',
  6: '24px',
  8: '32px',
  10: '40px',
  12: '48px',
  16: '64px',
  20: '80px',
  24: '96px',
} as const;

/**
 * Controls use `md`, app cards `lg`, marketing cards `2xl`.
 *
 * `pill` exists but is NOT the control radius. The Keycloak theme's owned
 * `button.tsx` currently forces `rounded-full`; adopting a shared control
 * radius means login buttons stop being pills. That was accepted as a
 * consequence, and it is a one-line revert (`--radius-md: var(--radius-pill)`).
 */
export const radius = {
  sm: '4px',
  md: '6px',
  lg: '10px',
  xl: '14px',
  '2xl': '20px',
  pill: '999px',
} as const;

export const font = {
  /** Already on the website via `next/font` and bundled in the KC theme as `@fontsource-variable/geist`. */
  sans: "'Geist Variable', 'Geist', system-ui, -apple-system, 'Segoe UI', sans-serif",
  /** Already the mono in both apps. */
  mono: "'JetBrains Mono Variable', 'JetBrains Mono', 'Cascadia Code', 'Fira Code', Consolas, monospace",
  /**
   * Website-only display face. Syne is demoted to optional here rather than
   * deleted: it carries the marketing site's identity, and nothing in the
   * authenticated products uses it.
   */
  displayMarketing: "'Syne', 'Geist Variable', system-ui, sans-serif",
} as const;

/**
 * One ladder for the whole system. Portalled Radix content lands at
 * `dropdown` and above, which is why the sticky app chrome has to stay
 * below it , a topbar at 1100 swallows its own dropdown.
 */
export const zIndex = {
  base: 0,
  raised: 10,
  sticky: 100,
  dropdown: 1000,
  overlay: 1100,
  modal: 1200,
  popover: 1300,
  toast: 1400,
  tooltip: 1500,
} as const;

/**
 * Light mode uses real shadows; dark mode delineates with 1px borders instead,
 * with `overlay` carved out for the glass tier , a floating surface needs
 * separation from the page in both themes.
 */
export const shadow = {
  sm: '0 1px 2px rgba(42, 43, 42, 0.06)',
  md: '0 2px 8px rgba(42, 43, 42, 0.08)',
  lg: '0 8px 24px rgba(42, 43, 42, 0.10)',
  overlay: '0 16px 48px rgba(14, 15, 14, 0.24)',
  none: 'none',
} as const;

/** Aligns with the dashboard app's motion spec: "120-180ms ease-out". */
export const duration = {
  micro: '120ms',
  enter: '180ms',
  overlay: '240ms',
  page: '320ms',
} as const;

export const easing = {
  /** Entrances. Decelerates hard , the motion settles rather than coasting. */
  out: 'cubic-bezier(0.32, 0.72, 0, 1)',
  /** Exits. */
  in: 'cubic-bezier(0.4, 0, 1, 1)',
} as const;

/** The authenticated shell is fluid; this is the marketing/content column. */
export const container = { page: '72rem' } as const;

/**
 * Kept in sync with the `editor.css` media query in the editor app: the rule is
 * that `useMediaQuery('(max-width: 768px)')` and the CSS breakpoint must agree,
 * or the two-surface mobile IA desynchronises mid-resize.
 */
export const breakpoint = {
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
} as const;

/** One scale's entries. Values are CSS strings, or plain numbers for `zIndex`. */
export type Scale = Readonly<Record<string, string | number>>;

/**
 * Every scale above, as one enumerable registry.
 *
 * This exists so nothing has to hand-list them. `/tokens` previously rendered
 * the scales as nine literal `<ScaleTable>` calls, which meant a tenth scale
 * added here would silently never appear on the page , the same class of drift
 * the contrast tables were restructured to eliminate. `scales.test.ts` asserts
 * this registry holds every scale the module exports, so the omission is a test
 * failure rather than a missing section.
 *
 * Deliberately typed as a plain `Record` rather than `as const`: this is the
 * *enumeration* API. Callers who want literal types (`radius.md` narrowing to
 * `'6px'`) should use the individual named exports, which are unchanged.
 */
export const SCALES: Readonly<Record<string, Scale>> = {
  radius,
  duration,
  easing,
  zIndex,
  shadow,
  font,
  breakpoint,
  container,
  spacing,
};
