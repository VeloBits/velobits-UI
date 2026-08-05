'use client';

import { cn } from '../lib/cn';

/**
 * A loading placeholder.
 *
 * `aria-hidden` with a sibling live region rather than `role="status"` on the
 * skeleton itself: a screen reader should hear "Loading flags" once, not
 * enumerate fourteen grey rectangles. Pair it with a single announcement:
 *
 * ```tsx
 * <span className="sr-only" role="status">Loading flags…</span>
 * {rows.map((r) => <Skeleton key={r} className="h-8 w-full" />)}
 * ```
 *
 * The pulse is a CSS animation, so the token layer's `prefers-reduced-motion`
 * block already stills it — no JS check needed.
 */
function Skeleton({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      data-slot="skeleton"
      aria-hidden="true"
      className={cn('animate-pulse rounded-md bg-bg2', className)}
      {...props}
    />
  );
}

export { Skeleton };
