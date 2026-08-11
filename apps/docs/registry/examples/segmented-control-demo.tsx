'use client';

import { useState } from 'react';

import { SegmentedControl } from '@velobits-dev/ui';

export default function SegmentedControlDemo() {
  const [env, setEnv] = useState('dev');
  const [scope, setScope] = useState('all');

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl
          aria-label="Environment"
          value={env}
          onValueChange={setEnv}
          options={[
            { value: 'dev', label: 'Development' },
            { value: 'staging', label: 'Staging', disabled: true },
            { value: 'prod', label: 'Production', tone: 'danger' },
          ]}
        />
        <span className="text-sm text-muted-foreground">
          selected: {env} · Staging is disabled · Production carries the danger tone
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <SegmentedControl
          aria-label="Scope"
          value={scope}
          onValueChange={setScope}
          options={[
            { value: 'all', label: 'All' },
            { value: 'mine', label: 'Mine' },
            { value: 'archived', label: 'Archived' },
          ]}
        />
      </div>
    </div>
  );
}
