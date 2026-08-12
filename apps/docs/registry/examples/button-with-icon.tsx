'use client';

import { Button, Spinner } from '@velobits/ui';
import { FlagIcon } from '@velobits/icons';

export default function ButtonWithIcon() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="primary">
        <FlagIcon />
        With icon
      </Button>
      <Button variant="primary" disabled>
        <Spinner size={16} />
        Saving…
      </Button>
      <Button variant="primary" disabled>
        Disabled
      </Button>
    </div>
  );
}
