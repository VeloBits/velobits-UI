'use client';

import {
  Button,
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Field,
  FieldControl,
  FieldDescription,
  FieldLabel,
  Input,
  Label,
  NativeSelect,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
  Textarea,
} from '@velobitsio/ui';
import { ChevronDownIcon, PlusIcon } from '@velobitsio/icons';

/**
 * The Popover inside is load-bearing rather than decorative.
 *
 * `.glass-elevated` , Tier O stacked on Tier O , is the composite the token suite
 * reasons about arithmetically and can never actually see: `GLASS_OVERLAY_PAIRS`
 * excludes the tier by name, and while `contrast.test.ts` now measures it against
 * both of its backdrops (added 2026-08-26, when the tier went from plum to a
 * near-black and its 60/255 hue separation became an 11/255 lightness one), that
 * is a computed composite, not a rendered one. Nesting is the only way to see the
 * real thing, and a picker inside a creation dialog is a genuine product pattern,
 * so the check rides along on a demo that earns its place anyway. Removing the
 * Popover leaves the elevated tier with no rendered coverage at all.
 */
export default function DialogDemo() {
  return (
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
  );
}
