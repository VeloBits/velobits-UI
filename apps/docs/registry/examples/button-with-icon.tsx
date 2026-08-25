'use client';

import { Button, Spinner } from '@velobitsio/ui';
import { FlagIcon } from '@velobitsio/icons';

export default function ButtonWithIcon() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="primary">
        <FlagIcon />
        With icon
      </Button>
      <Button variant="primary" disabled>
        {/* label={null}: the button's name is "Saving…", not "Loading Saving…". */}
        <Spinner size={16} label={null} />
        Saving…
      </Button>
      <Button variant="primary" disabled>
        Disabled
      </Button>
    </div>
  );
}
