'use client';

import { Alert, AlertDescription, AlertTitle } from '@velobits-dev/ui';
import { AlertTriangleIcon, FlagIcon } from '@velobits-dev/icons';

export default function AlertDemo() {
  return (
    <div className="space-y-3">
      <Alert>
        <FlagIcon />
        <AlertTitle>Neutral, glass</AlertTitle>
        <AlertDescription>The default. Tier S, same material as a Card.</AlertDescription>
      </Alert>
      <Alert surface="panel">
        <FlagIcon />
        <AlertTitle>Neutral, panel</AlertTitle>
        <AlertDescription>
          surface=&quot;panel&quot; — for use inside a glass parent.
        </AlertDescription>
      </Alert>
      <Alert variant="info">
        <FlagIcon />
        <AlertTitle>Inherited from Production</AlertTitle>
        <AlertDescription>This environment has no override of its own.</AlertDescription>
      </Alert>
      <Alert variant="success">
        <FlagIcon />
        <AlertTitle>Saved</AlertTitle>
        <AlertDescription>Your changes are live.</AlertDescription>
      </Alert>
      <Alert variant="warning">
        <AlertTriangleIcon />
        <AlertTitle>Partial rollout</AlertTitle>
        <AlertDescription>This flag is enabled for 40% of users.</AlertDescription>
      </Alert>
      <Alert variant="danger" role="alert">
        <AlertTriangleIcon />
        <AlertTitle>Rollout failed</AlertTitle>
        <AlertDescription>Check the target environment and retry.</AlertDescription>
      </Alert>
    </div>
  );
}
