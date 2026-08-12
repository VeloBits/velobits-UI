'use client';

import { Separator } from '@velobits/ui';

export default function SeparatorDemo() {
  return (
    <div className="max-w-xs space-y-3">
      <p className="text-sm">Above the rule</p>
      <Separator />
      <div className="flex h-8 items-center gap-3 text-sm">
        <span>Left</span>
        <Separator orientation="vertical" />
        <span>Right</span>
      </div>
    </div>
  );
}
