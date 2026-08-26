'use client';

import {
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@velobitsio/ui';

export default function PopoverDemo() {
  return (
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
          {/*
           * A `Select` inside a `PopoverContent` , the case that decided the
           * component's z-index. Both panels portal to the body, so they are
           * siblings in the root stacking context; at `z-dropdown` this one would
           * paint behind the popover it was opened from. `SelectContent` is
           * `z-popover` for exactly this composition.
           */}
          <Select defaultValue="prod">
            <SelectTrigger id="cx-pop-env">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dev">Development</SelectItem>
              <SelectItem value="staging">Staging</SelectItem>
              <SelectItem value="prod">Production</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  );
}
