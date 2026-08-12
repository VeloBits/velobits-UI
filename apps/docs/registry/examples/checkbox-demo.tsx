'use client';

import { Checkbox, Label } from '@velobits/ui';

export default function CheckboxDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="flex items-center gap-2">
        <Checkbox id="cx-check-1" defaultChecked />
        <Label htmlFor="cx-check-1">Checked</Label>
      </span>
      <span className="flex items-center gap-2">
        <Checkbox id="cx-check-2" checked="indeterminate" />
        <Label htmlFor="cx-check-2">Select all (indeterminate)</Label>
      </span>
      <span className="flex items-center gap-2">
        <Checkbox id="cx-check-3" disabled />
        <Label htmlFor="cx-check-3">Disabled</Label>
      </span>
    </div>
  );
}
