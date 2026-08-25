'use client';

import { Button, Spinner } from '@velobitsio/ui';

export default function SpinnerDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Spinner />
      <Spinner size={24} />
      <Button variant="primary" disabled>
        {/*
         * `label={null}` inside a control, always. The default label is an
         * `aria-label`, and an `aria-label` on a child is concatenated into the
         * accessible name of the button containing it , so without this the
         * button announces "Loading Saving…" instead of "Saving…".
         */}
        <Spinner size={16} label={null} />
        Saving…
      </Button>
    </div>
  );
}
