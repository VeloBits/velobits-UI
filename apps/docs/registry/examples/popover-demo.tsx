'use client';

import {
  Button,
  Label,
  NativeSelect,
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '@velobitsdevs/ui';

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
          <NativeSelect id="cx-pop-env" defaultValue="prod">
            <option value="dev">Development</option>
            <option value="staging">Staging</option>
            <option value="prod">Production</option>
          </NativeSelect>
        </div>
      </PopoverContent>
    </Popover>
  );
}
