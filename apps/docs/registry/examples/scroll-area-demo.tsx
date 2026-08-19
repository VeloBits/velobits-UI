'use client';

import { Badge, ScrollArea, ScrollBar, Separator } from '@velobitsio/ui';

const REGIONS = [
  'us-east-1',
  'us-east-2',
  'us-west-1',
  'us-west-2',
  'eu-west-1',
  'eu-west-2',
  'eu-central-1',
  'eu-north-1',
  'ap-south-1',
  'ap-southeast-1',
  'ap-southeast-2',
  'ap-northeast-1',
  'ap-northeast-2',
  'sa-east-1',
  'ca-central-1',
  'me-south-1',
];

export default function ScrollAreaDemo() {
  return (
    <div className="grid w-full gap-6 lg:grid-cols-2">
      <div className="space-y-2">
        <p className="text-sm font-medium">Vertical, with a bounded height</p>
        <ScrollArea className="h-56 rounded-xl border border-border p-3">
          <div className="space-y-2 pe-3">
            {REGIONS.map((region) => (
              <div key={region} className="flex items-center justify-between gap-3 text-sm">
                <code className="font-mono text-xs">{region}</code>
                <Badge variant="neutral">healthy</Badge>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium">Horizontal, via a second ScrollBar</p>
        <ScrollArea className="w-full rounded-xl border border-border p-3">
          <div className="flex gap-3 pb-3">
            {REGIONS.slice(0, 10).map((region) => (
              <div
                key={region}
                className="w-40 shrink-0 space-y-2 rounded-lg border border-dashed border-border p-3"
              >
                <code className="font-mono text-xs">{region}</code>
                <Separator />
                <p className="text-xs text-muted-foreground">12 flags evaluated</p>
              </div>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
    </div>
  );
}
