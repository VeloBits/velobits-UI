'use client';

import { cn } from '../lib/cn';

export interface GlassSurfaceProps extends React.ComponentProps<'div'> {
  /** `elevated` uses the plum-tinted tier, for glass stacked on glass. */
  tier?: 'default' | 'elevated';
  asChild?: never;
}

/**
 * The shared implementation behind every Tier-2 overlay's panel. Not for direct
 * use on page furniture — see the allow/forbid list below.
 *
 * ALLOWED: Dialog · Sheet/SidePanel · Popover · DropdownMenu · CommandPalette ·
 *          Toast · sticky TopBar/Navbar. All of them float over page content,
 *          which is the only place a blur reads as glass.
 *
 * FORBIDDEN: page/body backgrounds · table rows · anything inside a scroll
 *          container · nested glass · more than ~6 simultaneous instances.
 *
 * ## Two layout behaviours that will look like component bugs
 *
 *  - `backdrop-filter` establishes a containing block for `position: fixed`
 *    descendants, so a fixed child of a glass surface is trapped inside it.
 *  - It also forms a stacking context, so `z-index` within is scoped locally.
 *
 * ## One performance rule
 *
 * Never animate the blur RADIUS — each frame forces a full backdrop repaint.
 * Animate `opacity` and `transform`, which is what the `animate-in` utilities on
 * the overlay components already do.
 *
 * Legibility, fallbacks and the reduced-transparency override all live in
 * `@velobits/tokens/glass.css` under `.glass`, so they apply identically to any
 * consumer that reaches for the class directly.
 */
function GlassSurface({ className, tier = 'default', ...props }: GlassSurfaceProps) {
  return (
    <div
      data-slot="glass-surface"
      className={cn('glass', tier === 'elevated' && 'glass-elevated', className)}
      {...props}
    />
  );
}

export { GlassSurface };
