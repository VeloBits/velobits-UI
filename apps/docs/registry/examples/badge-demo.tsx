'use client';

import { Badge } from '@velobits/ui';

export default function BadgeDemo() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Badge>Neutral</Badge>
      <Badge variant="primary">Primary</Badge>
      <Badge variant="brand">Brand</Badge>
      <Badge variant="success">Live</Badge>
      <Badge variant="danger">Failed</Badge>
      <Badge variant="warning">Rollout</Badge>
      <Badge variant="info">Inherited</Badge>
      <Badge variant="outline">Outline</Badge>
    </div>
  );
}
