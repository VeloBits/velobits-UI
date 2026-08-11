'use client';

import { useState } from 'react';

import {
  Button,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
  CommandShortcut,
  Kbd,
} from '@velobits-dev/ui';
import { FlagIcon, PlusIcon } from '@velobits-dev/icons';

export default function CommandPaletteDemo() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Open command palette
        </Button>
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          or press <Kbd>⌘</Kbd> <Kbd>J</Kbd>
        </span>
      </div>
      {/*
       * Bound to ⌘J rather than ⌘K: this docs site binds ⌘K itself for its own
       * search, and two listeners on one chord means whichever mounted last wins.
       * A design system must not take a global key by merely being imported —
       * which is why `shortcut` is opt-in in the first place.
       */}
      <CommandDialog open={open} onOpenChange={setOpen} shortcut="j">
        <CommandInput placeholder="Search flags, environments, docs…" />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
          <CommandGroup heading="Actions">
            <CommandItem>
              <PlusIcon />
              New flag
              <CommandShortcut>⌘N</CommandShortcut>
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Flags">
            <CommandItem>
              <FlagIcon />
              new-checkout
            </CommandItem>
            <CommandItem>
              <FlagIcon />
              dark-mode-rollout
            </CommandItem>
            <CommandItem>
              <FlagIcon />
              beta-search
            </CommandItem>
          </CommandGroup>
          <CommandSeparator />
          <CommandGroup heading="Environments">
            <CommandItem>Development</CommandItem>
            <CommandItem>Staging</CommandItem>
            <CommandItem>Production</CommandItem>
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
