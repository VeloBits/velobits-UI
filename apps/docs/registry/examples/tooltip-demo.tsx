'use client';

import { Button, Tooltip, TooltipContent, TooltipTrigger } from '@velobitsio/ui';
import { SearchIcon } from '@velobitsio/icons';

export default function TooltipDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button variant="secondary">Hover or focus me</Button>
        </TooltipTrigger>
        <TooltipContent>Flags are evaluated at request time, not at build time.</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button size="icon" variant="ghost" aria-label="Search">
            <SearchIcon />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Search flags</TooltipContent>
      </Tooltip>
    </div>
  );
}
