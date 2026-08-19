'use client';

import { StatusChip, type Status } from '@velobitsio/ui';

const ALL_STATUSES: readonly Status[] = ['on', 'off', 'partial', 'pending', 'archived'];

export default function StatusChipDemo() {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        {ALL_STATUSES.map((status) => (
          <StatusChip key={status} status={status} />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <StatusChip status="partial">40%</StatusChip>
        <StatusChip status="partial">5%</StatusChip>
        <span className="text-sm text-muted-foreground">
          The label override: a percentage is strictly more information than &ldquo;Partial&rdquo;
          in the same space, and it still says the state.
        </span>
      </div>
    </div>
  );
}
