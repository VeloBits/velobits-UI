'use client';

import { useState } from 'react';

import { Alert, AlertDescription, AlertTitle, Button, Spinner } from '@velobitsdevs/ui';
import { FadeIn } from '@velobitsdevs/ui/motion';
import { CircleCheckIcon } from '@velobitsdevs/icons';

/**
 * The case that is neither a route nor a list: a result that arrives after a
 * fetch. `FadeIn` deliberately has no exit animation — an element that fades OUT
 * on unmount has to stay mounted while it does, which needs a parent
 * `AnimatePresence` and a stable key. `PageTransition` is the component that owns
 * that complexity.
 */
export default function MotionFadeIn() {
  const [state, setState] = useState<'idle' | 'loading' | 'done'>('idle');

  const run = () => {
    setState('loading');
    setTimeout(() => setState('done'), 700);
  };

  return (
    <div className="max-w-md space-y-4">
      <Button variant="primary" onClick={run} disabled={state === 'loading'}>
        {state === 'loading' && <Spinner size={16} />}
        {state === 'loading' ? 'Evaluating…' : 'Evaluate flag'}
      </Button>
      {state === 'done' && (
        <FadeIn>
          <Alert variant="success">
            <CircleCheckIcon />
            <AlertTitle>Enabled for this request</AlertTitle>
            <AlertDescription>
              Bucketed at 40% on seed <code>checkout-2026</code>.
            </AlertDescription>
          </Alert>
        </FadeIn>
      )}
    </div>
  );
}
