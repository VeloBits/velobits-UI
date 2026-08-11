'use client';

import { Skeleton } from '@velobits-dev/ui';

export default function SkeletonDemo() {
  return (
    <div className="max-w-sm space-y-2">
      <Skeleton className="h-9 w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}
