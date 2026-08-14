'use client';

import { Kbd, Separator } from '@velobitsio/ui';

export default function KbdDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <span className="flex items-center gap-1 text-sm">
        Open the palette
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
      </span>
      <Separator orientation="vertical" className="h-5" />
      <span className="flex items-center gap-1 text-sm">
        Dismiss
        <Kbd>Esc</Kbd>
      </span>
    </div>
  );
}
