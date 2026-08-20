'use client';

import { useState } from 'react';

import { Button, Card, CardContent, CardHeader, CardTitle, StatusChip } from '@velobitsio/ui';
import { STAGGER_LIMIT, Stagger, StaggerItem } from '@velobitsio/ui/motion';

const FLAGS = [
  { key: 'new-checkout', status: 'partial' },
  { key: 'dark-mode-rollout', status: 'on' },
  { key: 'beta-search', status: 'pending' },
  { key: 'legacy-export', status: 'off' },
  { key: 'usage-quotas', status: 'on' },
  { key: 'webhook-retries', status: 'off' },
] as const;

export default function MotionStagger() {
  // Remounting is what replays the entrance , the animation runs on mount, so a
  // demo of it needs a way to mount again.
  const [run, setRun] = useState(0);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button variant="secondary" size="sm" onClick={() => setRun((n) => n + 1)}>
          Replay
        </Button>
        <span className="text-sm text-muted-foreground">
          The cascade caps at {STAGGER_LIMIT} items, so a 200-row list finishes in the same time
          this six-row one does.
        </span>
      </div>
      <Stagger key={run} className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {FLAGS.map((flag) => (
          <StaggerItem key={flag.key}>
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  <code>{flag.key}</code>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <StatusChip status={flag.status} />
              </CardContent>
            </Card>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  );
}
