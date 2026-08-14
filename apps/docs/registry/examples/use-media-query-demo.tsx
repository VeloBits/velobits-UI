'use client';

import { Badge, useMediaQuery, usePrefersReducedMotion } from '@velobitsdevs/ui';
import { breakpoint } from '@velobitsdevs/tokens';

/**
 * The breakpoint comes from `@velobitsdevs/tokens`, not from a re-typed pixel
 * value — that is what keeps the JS and CSS breakpoint from drifting apart.
 */
export default function UseMediaQueryDemo() {
  const isDesktop = useMediaQuery(`(min-width: ${breakpoint.md})`);
  const reducedMotion = usePrefersReducedMotion();

  return (
    <div className="space-y-2 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground">(min-width: {breakpoint.md})</span>
        <Badge variant={isDesktop ? 'success' : 'neutral'}>{String(isDesktop)}</Badge>
        <span className="text-muted-foreground">— resize the window</span>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-muted-foreground">prefers-reduced-motion</span>
        <Badge variant={reducedMotion ? 'warning' : 'neutral'}>{String(reducedMotion)}</Badge>
      </div>
    </div>
  );
}
