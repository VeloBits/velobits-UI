'use client';

import { StatusChip } from '@velobitsio/ui';
import { CalendarIcon, LockIcon, UsersIcon } from '@velobitsio/icons';

export default function StatusChipCustom() {
  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-fg">The glyph.</span> An element, so a spinner or a
          vendor mark goes in the same slot. It stays out of the accessibility tree whether or not
          it hides itself &mdash; the wrapper carries <code>aria-hidden</code>.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <StatusChip status="pending" icon={<CalendarIcon />}>
            Scheduled
          </StatusChip>
          <StatusChip status="partial" icon={<UsersIcon />}>
            Beta
          </StatusChip>
          <StatusChip status="off" icon={<LockIcon />}>
            Locked
          </StatusChip>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-fg">The colour.</span> A <code>Badge</code> variant, not
          a colour &mdash; every reachable value is a wash/text pairing the soft-chip contrast suite
          has already measured over page, panel and glass in both themes. Here a staging rollout
          that should not read as production-green.
        </p>
        <div className="flex flex-wrap items-center gap-3">
          <StatusChip status="on" />
          <StatusChip status="on" variant="info">
            On &middot; staging
          </StatusChip>
          <StatusChip status="partial" variant="info">
            Planned 25%
          </StatusChip>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm text-muted-foreground">
          <span className="font-medium text-fg">What the overrides cannot check.</span> The chip
          only ever sees itself, so nothing stops a set being recoloured or re-glyphed until two
          states look alike. <code>status</code> is unchanged in every chip above: it still drives{' '}
          <code>data-status</code> and <code>STATUS_ORDER</code>, so a dressed-up chip still sorts,
          filters and groups as the state it actually is.
        </p>
      </div>
    </div>
  );
}
