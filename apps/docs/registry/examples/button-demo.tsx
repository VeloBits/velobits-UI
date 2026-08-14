'use client';

import { Button } from '@velobitsdevs/ui';

export default function ButtonDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="primary">Primary</Button>
      <Button variant="brand">Brand</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="destructive">Delete</Button>
      <Button variant="link">Docs</Button>
    </div>
  );
}
