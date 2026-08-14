'use client';

import { Button } from '@velobitsio/ui';
import { TrashIcon } from '@velobitsio/icons';

export default function ButtonSizes() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="primary" size="sm">
        Small
      </Button>
      <Button variant="primary">Default</Button>
      <Button variant="primary" size="lg">
        Large
      </Button>
      <Button size="icon" aria-label="Delete flag">
        <TrashIcon />
      </Button>
    </div>
  );
}
