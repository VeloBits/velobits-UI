'use client';

import { Label, Switch } from '@velobits/ui';

export default function SwitchDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="flex items-center gap-2">
        <Switch id="cx-switch-1" defaultChecked />
        <Label htmlFor="cx-switch-1">Enabled in Production</Label>
      </span>
      <span className="flex items-center gap-2">
        <Switch id="cx-switch-2" disabled />
        <Label htmlFor="cx-switch-2">Disabled</Label>
      </span>
    </div>
  );
}
