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
  Input,
  Label,
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
  Toast,
  ToastAction,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@velobits-dev/ui';
import { CircleCheckIcon, AlertTriangleIcon, FlagIcon, PlusIcon } from '@velobits-dev/icons';

import { Row, Section } from './section';

export function DialogSection() {
  return (
    <Section title="Dialog">
      <Row>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="primary">Open dialog</Button>
          </DialogTrigger>
          <DialogContent focusFirstField>
            <DialogHeader>
              <DialogTitle>Create flag</DialogTitle>
              <DialogDescription>A Tier-O glass surface over the page.</DialogDescription>
            </DialogHeader>
            <div className="space-y-2 py-2">
              <Label htmlFor="pv-dialog-key">Flag key</Label>
              <Input id="pv-dialog-key" placeholder="new-checkout" />
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button variant="ghost">Cancel</Button>
              </DialogClose>
              <Button variant="primary">Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Row>
    </Section>
  );
}

export function SidePanelSection() {
  return (
    <Section title="SidePanel">
      <Row>
        <SidePanel>
          <SidePanelTrigger asChild>
            <Button variant="secondary">Open side panel</Button>
          </SidePanelTrigger>
          <SidePanelContent>
            <SidePanelHeader>
              <SidePanelTitle>Flag detail</SidePanelTitle>
              <SidePanelDescription>Slides in from the inline end.</SidePanelDescription>
            </SidePanelHeader>
            <p className="px-4 text-sm text-muted-foreground">
              Body content. Esc closes; focus returns to the trigger.
            </p>
            <SidePanelFooter>
              <SidePanelClose asChild>
                <Button variant="secondary">Close</Button>
              </SidePanelClose>
            </SidePanelFooter>
          </SidePanelContent>
        </SidePanel>
      </Row>
    </Section>
  );
}

export function PopoverSection() {
  return (
    <Section title="Popover">
      <Row>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="secondary">Open popover</Button>
          </PopoverTrigger>
          <PopoverContent>
            <PopoverHeader>
              <PopoverTitle>Rollout summary</PopoverTitle>
              <PopoverDescription>
                Anchored, non-modal, on the elevated glass tier.
              </PopoverDescription>
            </PopoverHeader>
          </PopoverContent>
        </Popover>
      </Row>
    </Section>
  );
}

export function DropdownMenuSection() {
  const [withArchived, setWithArchived] = useState(true);
  const [env, setEnv] = useState('prod');

  return (
    <Section title="DropdownMenu">
      <Row>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary">Open menu</Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            <DropdownMenuLabel>Flag actions</DropdownMenuLabel>
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
            <DropdownMenuRadioGroup value={env} onValueChange={setEnv}>
              <DropdownMenuRadioItem value="dev">Development</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="staging">Staging</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="prod">Production</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                <DropdownMenuItem>Export</DropdownMenuItem>
                <DropdownMenuItem variant="danger">Delete</DropdownMenuItem>
              </DropdownMenuSubContent>
            </DropdownMenuSub>
          </DropdownMenuContent>
        </DropdownMenu>
      </Row>
    </Section>
  );
}

interface ToastEntry {
  id: number;
  variant: 'success' | 'danger';
}

export function ToastSection() {
  const [toasts, setToasts] = useState<ToastEntry[]>([]);
  const [nextId, setNextId] = useState(0);

  const fire = (variant: ToastEntry['variant']) => {
    setToasts((current) => [...current, { id: nextId, variant }]);
    setNextId((n) => n + 1);
  };

  return (
    <Section
      title="Toast"
      note="Provider and viewport are mounted in this section, outside any glass ancestor."
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
                ? 'Your changes are live in Production.'
                : 'The server rejected the change.'}
            </ToastDescription>
            <ToastAction altText="Open the flag's history to undo this change">Undo</ToastAction>
            <ToastClose />
          </Toast>
        ))}
        <ToastViewport />
      </ToastProvider>
    </Section>
  );
}

export function CommandPaletteSection() {
  const [open, setOpen] = useState(false);

  return (
    <Section title="CommandPalette" note="Also bound to ⌘K / Ctrl+K while this page is open.">
      <Row>
        <Button variant="secondary" onClick={() => setOpen(true)}>
          Open command palette
        </Button>
      </Row>
      <CommandDialog open={open} onOpenChange={setOpen} shortcut="k">
        <CommandInput placeholder="Search flags, environments, docs…" />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
          <CommandGroup heading="Flags">
            <CommandItem>
              <PlusIcon />
              New flag
              <CommandShortcut>⌘N</CommandShortcut>
            </CommandItem>
            <CommandItem>
              <FlagIcon />
              new-checkout
            </CommandItem>
            <CommandItem>
              <FlagIcon />
              dark-mode-rollout
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
    </Section>
  );
}
