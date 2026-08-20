'use client';

import {
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@velobitsio/ui';

export default function CardDemo() {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <Card>
        <CardHeader>
          <CardTitle>Production</CardTitle>
          <CardDescription>12 flags enabled · last deploy 4 minutes ago</CardDescription>
          <CardAction>
            <Badge variant="success">Healthy</Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          The archetypal Tier-S surface, with the page as its backdrop, which is the backdrop the
          perceptibility gate measures it against.
        </CardContent>
        <CardFooter>
          <Button variant="secondary" size="sm">
            View flags
          </Button>
        </CardFooter>
      </Card>
      <Card surface="panel">
        <CardHeader>
          <CardTitle>Staging</CardTitle>
          <CardDescription>surface=&quot;panel&quot;, the opaque original</CardDescription>
          <CardAction>
            <Badge variant="warning">Drifted</Badge>
          </CardAction>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          The right answer inside another Card, inside a Tier-O overlay, or anywhere nesting glass
          in glass would cancel both layers.
        </CardContent>
        <CardFooter>
          <Button variant="secondary" size="sm">
            View flags
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
