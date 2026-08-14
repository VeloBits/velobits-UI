'use client';

import { Input } from '@velobitsdevs/ui';

export default function InputDemo() {
  return (
    <div className="grid max-w-2xl gap-3 sm:grid-cols-2">
      <Input placeholder="Search flags…" />
      <Input defaultValue="new-checkout" />
      <Input disabled placeholder="Disabled" />
      <Input type="search" placeholder="Type to filter" aria-label="Filter flags" />
    </div>
  );
}
