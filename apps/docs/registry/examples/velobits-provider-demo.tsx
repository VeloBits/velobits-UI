'use client';

import {
  Button,
  THEME_STORAGE_KEYS,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  VelobitsProvider,
  useTheme,
} from '@velobits-dev/ui';

function Inside() {
  const { theme, mounted } = useTheme();
  return (
    <div className="flex flex-wrap items-center gap-3 text-sm">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="secondary">Hover me</Button>
        </TooltipTrigger>
        {/* No TooltipProvider here — the one inside VelobitsProvider is it. */}
        <TooltipContent>The provider supplied this TooltipProvider.</TooltipContent>
      </Tooltip>
      <span className="text-muted-foreground">
        theme resolves to <code>{mounted ? theme : '…'}</code>
      </span>
    </div>
  );
}

/**
 * Normally mounted ONCE at the shell root. It is nested here only so the demo is
 * self-contained; a second provider in a real app means a second TooltipProvider
 * context, which is the thing Module Federation consumers must avoid.
 */
export default function VelobitsProviderDemo() {
  return (
    <VelobitsProvider storageKey={THEME_STORAGE_KEYS.dashboard}>
      <Inside />
    </VelobitsProvider>
  );
}
