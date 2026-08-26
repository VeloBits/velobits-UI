'use client';

import {
  Label,
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
} from '@velobitsio/ui';

/**
 * Three states in one frame, because the interesting thing about this component
 * is what it does when it OPENS, and a single closed trigger shows none of it:
 * a plain field, a placeholder (no value yet), and a grouped list with a
 * separator. The `sm` size lives on the CodeBlock above every snippet on this
 * page, so it is already on screen and is not repeated here.
 */
export default function SelectDemo() {
  return (
    <div className="grid w-full max-w-sm gap-4">
      <div className="space-y-2">
        <Label htmlFor="select-demo-env">Environment</Label>
        <Select defaultValue="prod">
          <SelectTrigger id="select-demo-env">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="dev">Development</SelectItem>
            <SelectItem value="staging">Staging</SelectItem>
            <SelectItem value="prod">Production</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="select-demo-empty">Rollout strategy</Label>
        <Select>
          <SelectTrigger id="select-demo-empty">
            {/*
             * With no value, Radix marks the TRIGGER `data-placeholder` and the
             * component's own `data-[placeholder]:text-muted-foreground` mutes
             * it. The placeholder text is not separately targetable, which is
             * why the hook lives on the trigger rather than here.
             */}
            <SelectValue placeholder="Choose a strategy" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Everyone</SelectItem>
            <SelectItem value="percent">Percentage of traffic</SelectItem>
            <SelectItem value="attribute">By user attribute</SelectItem>
            <SelectItem value="off" disabled>
              Scheduled (coming soon)
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="select-demo-grouped">Deploy target</Label>
        <Select defaultValue="eu-west-1">
          <SelectTrigger id="select-demo-grouped">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Europe</SelectLabel>
              <SelectItem value="eu-west-1">eu-west-1 · Ireland</SelectItem>
              <SelectItem value="eu-central-1">eu-central-1 · Frankfurt</SelectItem>
            </SelectGroup>
            <SelectSeparator />
            <SelectGroup>
              <SelectLabel>North America</SelectLabel>
              <SelectItem value="us-east-1">us-east-1 · N. Virginia</SelectItem>
              <SelectItem value="us-west-2">us-west-2 · Oregon</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
