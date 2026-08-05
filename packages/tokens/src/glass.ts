import { neutral, seed } from './palette';

/**
 * Glassmorphism is scoped to the **overlay tier only** — surfaces that float
 * over page content, which is the only place a blur reads as glass rather than
 * as mud.
 *
 * Allowed:  Dialog · Sheet/SidePanel · Popover · DropdownMenu · CommandPalette ·
 *           Toast · sticky TopBar/Navbar.
 * Forbidden: page and body backgrounds, table rows, anything inside a scroll
 *           container, nested glass, or more than ~6 simultaneous instances.
 *
 * Two layout behaviours to design around rather than debug later:
 *  - `backdrop-filter` establishes a containing block for `position: fixed`
 *    descendants, so a fixed child inside a glass surface is trapped by it.
 *  - It also forms a stacking context.
 *  - Animating the blur *radius* forces a full backdrop repaint every frame.
 *    Animate opacity and transform instead.
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
 * The measured floor for body text on glass over the worst backdrop in the
 * palette. Below this, a light glass over the lime brand fill stops clearing AA.
 * Asserted in `test/contrast.test.ts`, so lowering an alpha fails CI.
 */
export const GLASS_ALPHA_FLOOR = 0.72;

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
} as const satisfies Record<string, GlassTier>;

export type GlassTierName = keyof typeof glass;
