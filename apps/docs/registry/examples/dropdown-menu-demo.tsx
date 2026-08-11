'use client';

import { useState } from 'react';

import {
  Button,
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '@velobits-dev/ui';
import { EllipsisIcon, SlidersIcon } from '@velobits-dev/icons';

export default function DropdownMenuDemo() {
  const [withArchived, setWithArchived] = useState(true);
  const [env, setEnv] = useState('prod');

  return (
    <div className="flex flex-wrap items-center gap-3">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="secondary">
            <SlidersIcon />
            Flag actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuLabel>new-checkout</DropdownMenuLabel>
          <DropdownMenuItem>
            Edit
            <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>Duplicate</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem checked={withArchived} onCheckedChange={setWithArchived}>
            Show archived
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>Environment</DropdownMenuLabel>
          <DropdownMenuRadioGroup value={env} onValueChange={setEnv}>
            <DropdownMenuRadioItem value="dev">Development</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="staging">Staging</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="prod">Production</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSeparator />
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Export as JSON</DropdownMenuItem>
              <DropdownMenuItem>Copy key</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="danger">Archive flag</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" aria-label="Row actions">
            <EllipsisIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem variant="danger">Delete</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
