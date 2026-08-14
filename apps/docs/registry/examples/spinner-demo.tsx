'use client';

import { Button, Spinner } from '@velobitsdevs/ui';

export default function SpinnerDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Spinner />
      <Spinner size={24} />
      <Button variant="primary" disabled>
        <Spinner size={16} />
        Saving…
      </Button>
    </div>
  );
}
