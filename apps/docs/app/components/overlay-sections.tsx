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
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  Field,
  FieldControl,
  FieldDescription,
  FieldLabel,
  Input,
  Kbd,
  Label,
  NativeSelect,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  SidePanel,
  SidePanelClose,
  SidePanelContent,
  SidePanelDescription,
  SidePanelFooter,
  SidePanelHeader,
  SidePanelTitle,
  SidePanelTrigger,
  StatusChip,
  Textarea,
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@velobits-dev/ui';
import {
  AlertTriangleIcon,
  ChevronDownIcon,
  CircleCheckIcon,
  EllipsisIcon,
  FlagIcon,
  PlusIcon,
  SlidersIcon,
} from '@velobits-dev/icons';

import { Demo, Row } from '../section';

/*
 * Tier 2 — the six overlays. Every one opens from a real trigger: a screenshot
 * of an overlay proves nothing about focus, Escape, or the material, which is
 * the entire content of this tier.
 *
 * BLUR BUDGET: all six are closed at rest, so this file contributes ZERO live
 * backdrop layers until something is opened. That is what keeps the page at 5.
 */

/**
 * The Dialog carries a Popover inside it, and that is load-bearing rather than
 * decorative.
 *
 * `.glass-elevated` — Tier O stacked on Tier O — is the one composite in the
 * system that **no gate measures**. `GLASS_OVERLAY_PAIRS` excludes it by name
 * ("it stacks on another overlay, so the page is not its backdrop"), and a
 * `GlassSurface tier="elevated"` sitting on the page forms a different composite
 * from the one that matters. Nesting is the only way to see the real thing.
 *
 * It is here rather than on a diagnostics route because a picker inside a
 * creation dialog is a genuine product pattern — the check rides along on a
 * demo that earns its place anyway. Removing the Popover silently removes the
 * only coverage the elevated tier has.
 */
export function DialogDemo() {
  return (
    <Demo
      title="Dialog"
      note="Tier-O glass over a scrim. Focus is trapped while open, Escape closes, and focus returns to the trigger. `focusFirstField` is a prop because autoFocus is silently swallowed by Radix's FocusScope. The environment picker inside opens on the ELEVATED tier — plum-tinted in dark so it does not sink into the dialog beneath it."
    >
      <Row>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="primary">
              <PlusIcon />
              Create flag
            </Button>
          </DialogTrigger>
          <DialogContent focusFirstField>
            <DialogHeader>
              <DialogTitle>Create flag</DialogTitle>
              <DialogDescription>
                It starts off in every environment. You can roll it out afterwards.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <Field>
                <FieldLabel>Flag key</FieldLabel>
                <FieldControl>
                  <Input placeholder="new-checkout" />
                </FieldControl>
                <FieldDescription>Lowercase letters, digits and dashes only.</FieldDescription>
              </Field>
              <Field>
                <FieldLabel>Description</FieldLabel>
                <FieldControl>
                  <Textarea placeholder="What does this flag control?" />
                </FieldControl>
              </Field>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="secondary" className="w-full justify-between">
                    Rollout: off everywhere
                    <ChevronDownIcon />
                  </Button>
                </PopoverTrigger>
                <PopoverContent>
                  <PopoverHeader>
                    <PopoverTitle>Initial rollout</PopoverTitle>
                    <PopoverDescription>
                      Elevated glass, over the dialog&apos;s own Tier-O surface.
                    </PopoverDescription>
                  </PopoverHeader>
                  <div className="space-y-2 pt-2">
                    <Label htmlFor="cx-dialog-env">Enable in</Label>
                    <NativeSelect id="cx-dialog-env" defaultValue="none">
                      <option value="none">No environment</option>
                      <option value="dev">Development only</option>
                      <option value="all">All environments</option>
                    </NativeSelect>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <Button variant="primary">Create flag</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Row>
    </Demo>
  );
}

export function SidePanelDemo() {
  return (
    <Demo
      title="SidePanel"
      note="A separate component, not a Dialog variant — the two differ in where focus lands on open, which is not a thing a variant flag can carry honestly."
    >
      <Row>
        <SidePanel>
          <SidePanelTrigger asChild>
            <Button variant="secondary">Open flag detail</Button>
          </SidePanelTrigger>
          <SidePanelContent>
            <SidePanelHeader>
              <SidePanelTitle>new-checkout</SidePanelTitle>
              <SidePanelDescription>Slides in from the inline end.</SidePanelDescription>
            </SidePanelHeader>
            <div className="space-y-4 px-4 text-sm">
              <div className="flex items-center gap-2">
                <StatusChip status="partial">40%</StatusChip>
                <span className="text-muted-foreground">in Production</span>
              </div>
              <p className="text-muted-foreground">
                Escape closes the panel and focus returns to the trigger. Below the md breakpoint
                this same component is what AppShell uses for its nav drawer.
              </p>
            </div>
            <SidePanelFooter>
              <SidePanelClose asChild>
                <Button variant="ghost">Close</Button>
              </SidePanelClose>
              <Button variant="primary">Save</Button>
            </SidePanelFooter>
          </SidePanelContent>
        </SidePanel>
      </Row>
    </Demo>
  );
}

export function PopoverDemo() {
  return (
    <Demo
      title="Popover"
      note="Anchored and non-modal, on the elevated tier. Wires aria-labelledby, so it is never an unnamed dialog."
    >
      <Row>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="secondary">Rollout summary</Button>
          </PopoverTrigger>
          <PopoverContent>
            <PopoverHeader>
              <PopoverTitle>Rollout</PopoverTitle>
              <PopoverDescription>40% of traffic, seeded on checkout-2026.</PopoverDescription>
            </PopoverHeader>
            <div className="space-y-2 pt-2">
              <Label htmlFor="cx-pop-env">Environment</Label>
              <NativeSelect id="cx-pop-env" defaultValue="prod">
                <option value="dev">Development</option>
                <option value="staging">Staging</option>
                <option value="prod">Production</option>
              </NativeSelect>
            </div>
          </PopoverContent>
        </Popover>
      </Row>
    </Demo>
  );
}

export function DropdownMenuDemo() {
  const [withArchived, setWithArchived] = useState(true);
  const [env, setEnv] = useState('prod');

  return (
    <Demo
      title="DropdownMenu"
      note="Items, checkbox items, a radio group and a submenu. Highlighting is data-[highlighted], not :hover — keyboard and pointer must look identical."
    >
      <Row>
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
      </Row>
    </Demo>
  );
}

interface ToastEntry {
  id: number;
  variant: 'success' | 'danger';
}

export function ToastDemo() {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const [nextId, setNextId] = useState(0);

  const fire = (variant: ToastEntry['variant']) => {
    setToasts((current) => [...current, { id: nextId, variant }]);
    setNextId((n) => n + 1);
  };

  return (
    <Demo
      title="Toast"
      note="Swipe direction defaults to `down`, not `right` — the viewport sits at the inline end, so a rightward swipe would push it further off screen. Provider and viewport are mounted here, outside any glass ancestor."
    >
      <ToastProvider>
        <Row>
          <Button variant="secondary" onClick={() => fire('success')}>
            Show success toast
          </Button>
          <Button variant="secondary" onClick={() => fire('danger')}>
            Show danger toast
          </Button>
        </Row>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            variant={toast.variant}
            onOpenChange={(open) => {
              if (!open) setToasts((current) => current.filter((t) => t.id !== toast.id));
            }}
          >
            {toast.variant === 'success' ? <CircleCheckIcon /> : <AlertTriangleIcon />}
            <ToastTitle>{toast.variant === 'success' ? 'Flag saved' : 'Save failed'}</ToastTitle>
            <ToastDescription>
              {toast.variant === 'success'
                ? 'new-checkout is live in Production.'
                : 'The server rejected the change.'}
            </ToastDescription>
            <ToastAction altText="Open the flag's history to undo this change">Undo</ToastAction>
            <ToastClose />
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
    </Demo>
  );
}

export function CommandPaletteDemo() {
  const [open, setOpen] = useState(false);

  return (
    <Demo
      title="CommandPalette"
      note="Also bound to ⌘K / Ctrl+K while this page is open — try it without touching the button."
    >
      <Row>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Open command palette
        </Button>
        <span className="flex items-center gap-1 text-sm text-muted-foreground">
          or press <Kbd>⌘</Kbd> <Kbd>K</Kbd>
        </span>
      </Row>
      <CommandDialog open={open} onOpenChange={setOpen} shortcut="k">
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
    </Demo>
  );
}
