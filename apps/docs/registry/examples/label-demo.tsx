'use client';

import { Input, Label } from '@velobitsdevs/ui';

export default function LabelDemo() {
  return (
    <div className="max-w-xs space-y-2">
      <Label htmlFor="cx-label-input">Environment name</Label>
      <Input id="cx-label-input" placeholder="staging" />
    </div>
  );
}
