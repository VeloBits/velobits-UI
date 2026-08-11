'use client';

import { useState } from 'react';

import {
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  SegmentedControl,
} from '@velobits-dev/ui';
import { PageTransition } from '@velobits-dev/ui/motion';

const ROUTES = {
  targeting: {
    title: 'Targeting',
    body: 'Rules are evaluated top to bottom; the first match wins.',
  },
  history: {
    title: 'History',
    body: 'Every state change is written to the audit log with its actor.',
  },
  settings: {
    title: 'Settings',
    body: 'Key, description and owning team.',
  },
} as const;

type RouteKey = keyof typeof ROUTES;

/**
 * `transitionKey` stands in for the route here — `usePathname()` in Next,
 * `useLocation().pathname` in React Router. With a constant value the component
 * renders once and never animates again, which reads as the transition being
 * broken rather than the key being wrong.
 */
export default function MotionDemo() {
  const [route, setRoute] = useState<RouteKey>('targeting');
  const current = ROUTES[route];

  return (
    <div className="space-y-4">
      <SegmentedControl
        aria-label="Route"
        value={route}
        onValueChange={(value) => setRoute(value as RouteKey)}
        options={[
          { value: 'targeting', label: 'Targeting' },
          { value: 'history', label: 'History' },
          { value: 'settings', label: 'Settings' },
        ]}
      />
      <PageTransition transitionKey={route}>
        <Card>
          <CardHeader>
            <CardTitle>{current.title}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>{current.body}</p>
            <Button variant="secondary" size="sm">
              Edit {current.title.toLowerCase()}
            </Button>
          </CardContent>
        </Card>
      </PageTransition>
    </div>
  );
}
