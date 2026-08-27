'use client';

import { StatusChip, type Status } from '@velobitsio/ui';

const ALL_STATUSES: readonly Status[] = ['on', 'off', 'partial', 'pending', 'archived'];

export default function StatusChipDemo() {
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        {ALL_STATUSES.map((status) => (
          <StatusChip key={status} status={status} />
        ))}
      </div>
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-fg">The label override.</span> A percentage is strictly
          more information than &ldquo;Partial&rdquo; in the same space, and it still says the
          state.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <StatusChip status="partial">40%</StatusChip>
          <StatusChip status="partial">5%</StatusChip>
        </div>
      </div>
    </div>
  );
}
