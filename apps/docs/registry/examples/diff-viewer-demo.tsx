'use client';

import { DiffViewer, diffLines } from '@velobitsdevs/ui';

const BEFORE = `{
  "key": "new-checkout",
  "state": "off",
  "rollout": 0
}`;

const AFTER = `{
  "key": "new-checkout",
  "state": "partial",
  "rollout": 40,
  "seed": "checkout-2026"
}`;

export default function DiffViewerDemo() {
  return (
    <div className="max-w-2xl">
      <DiffViewer lines={diffLines(BEFORE, AFTER)} label="Config v3 → v4" />
    </div>
  );
}
