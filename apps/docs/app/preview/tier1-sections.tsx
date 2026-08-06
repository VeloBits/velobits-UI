'use client';

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarFallback,
  AvatarImage,
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Checkbox,
  Field,
  FieldControl,
  FieldDescription,
  FieldError,
  FieldLabel,
  Input,
  Kbd,
  Label,
  NativeSelect,
  Separator,
  Skeleton,
  Spinner,
  Switch,
  Textarea,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@velobits-dev/ui';
import { AlertTriangleIcon, FlagIcon, TrashIcon } from '@velobits-dev/icons';

import { Row, Section } from './section';

export function ButtonSection() {
  return (
    <Section title="Button">
      <Row>
        <Button variant="primary">Primary</Button>
        <Button variant="brand">Brand</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Delete</Button>
        <Button variant="link">Link</Button>
        <Button variant="primary" size="sm">
          Small
        </Button>
        <Button variant="primary" size="lg">
          Large
        </Button>
        <Button size="icon" aria-label="Delete flag">
          <TrashIcon />
        </Button>
        <Button variant="primary" disabled>
          Disabled
        </Button>
        <Button variant="secondary">
          <FlagIcon />
          With icon
        </Button>
      </Row>
    </Section>
  );
}

export function BadgeSection() {
  return (
    <Section title="Badge">
      <Row>
        <Badge>Neutral</Badge>
        <Badge variant="primary">Primary</Badge>
        <Badge variant="brand">Brand</Badge>
        <Badge variant="success">Success</Badge>
        <Badge variant="danger">Danger</Badge>
        <Badge variant="warning">Warning</Badge>
        <Badge variant="info">Info</Badge>
        <Badge variant="outline">Outline</Badge>
      </Row>
    </Section>
  );
}

export function CardSection() {
  return (
    <Section title="Card" note="Glass (Tier S) by default, sitting directly on the page.">
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Glass card</CardTitle>
            <CardDescription>The default Tier-S material.</CardDescription>
            <CardAction>
              <Badge variant="success">Healthy</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Its backdrop is the page, so the tint is measured against one thing.
          </CardContent>
          <CardFooter>
            <Button variant="secondary" size="sm">
              Action
            </Button>
          </CardFooter>
        </Card>
        <Card surface="panel">
          <CardHeader>
            <CardTitle>Panel card</CardTitle>
            <CardDescription>surface=&quot;panel&quot; — the opaque original.</CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            The right choice inside another Card or inside a Tier-O overlay.
          </CardContent>
        </Card>
      </div>
    </Section>
  );
}

export function AlertSection() {
  return (
    <Section title="Alert">
      <div className="space-y-3">
        <Alert>
          <FlagIcon />
          <AlertTitle>Neutral (glass)</AlertTitle>
          <AlertDescription>The default Tier-S surface.</AlertDescription>
        </Alert>
        <Alert surface="panel">
          <FlagIcon />
          <AlertTitle>Neutral (panel)</AlertTitle>
          <AlertDescription>The opaque variant.</AlertDescription>
        </Alert>
        <Alert variant="info">
          <FlagIcon />
          <AlertTitle>Info</AlertTitle>
          <AlertDescription>A neutral piece of information.</AlertDescription>
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
    </Section>
  );
}

export function AvatarSection() {
  return (
    <Section title="Avatar">
      <Row>
        <Avatar>
          <AvatarImage src="/icon.svg" alt="" />
          <AvatarFallback>VB</AvatarFallback>
        </Avatar>
        {/* No image at all, so the fallback shows without a console 404. */}
        <Avatar>
          <AvatarFallback>NS</AvatarFallback>
        </Avatar>
      </Row>
    </Section>
  );
}

export function CheckboxSection() {
  return (
    <Section title="Checkbox">
      <Row>
        <span className="flex items-center gap-2">
          <Checkbox id="pv-check-1" defaultChecked />
          <Label htmlFor="pv-check-1">Checked</Label>
        </span>
        <span className="flex items-center gap-2">
          <Checkbox id="pv-check-2" checked="indeterminate" />
          <Label htmlFor="pv-check-2">Indeterminate</Label>
        </span>
        <span className="flex items-center gap-2">
          <Checkbox id="pv-check-3" disabled />
          <Label htmlFor="pv-check-3">Disabled</Label>
        </span>
      </Row>
    </Section>
  );
}

export function FieldSection() {
  return (
    <Section title="Field" note="Label, control, description and error wiring.">
      <div className="grid max-w-2xl gap-5 sm:grid-cols-2">
        <Field>
          <FieldLabel>Flag key</FieldLabel>
          <FieldControl>
            <Input placeholder="new-checkout" />
          </FieldControl>
          <FieldDescription>Lowercase and dashes only.</FieldDescription>
        </Field>
        <Field error="That key is already taken">
          <FieldLabel>Flag key</FieldLabel>
          <FieldControl>
            <Input defaultValue="new-checkout" />
          </FieldControl>
          <FieldDescription>Lowercase and dashes only.</FieldDescription>
          <FieldError>That key is already taken</FieldError>
        </Field>
      </div>
    </Section>
  );
}

export function InputSection() {
  return (
    <Section title="Input">
      <div className="grid max-w-2xl gap-3 sm:grid-cols-2">
        <Input placeholder="Search flags…" />
        <Input disabled placeholder="Disabled" />
      </div>
    </Section>
  );
}

export function KbdSection() {
  return (
    <Section title="Kbd">
      <Row>
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
        <Kbd>Esc</Kbd>
      </Row>
    </Section>
  );
}

export function LabelSection() {
  return (
    <Section title="Label">
      <div className="max-w-xs space-y-2">
        <Label htmlFor="pv-label-input">Environment name</Label>
        <Input id="pv-label-input" placeholder="staging" />
      </div>
    </Section>
  );
}

export function NativeSelectSection() {
  return (
    <Section title="NativeSelect">
      <div className="max-w-xs">
        <NativeSelect aria-label="Environment" defaultValue="prod">
          <option value="dev">Development</option>
          <option value="staging">Staging</option>
          <option value="prod">Production</option>
        </NativeSelect>
      </div>
    </Section>
  );
}

export function SeparatorSection() {
  return (
    <Section title="Separator">
      <div className="max-w-xs space-y-3">
        <p className="text-sm">Above the rule</p>
        <Separator />
        <div className="flex h-8 items-center gap-3 text-sm">
          <span>Left</span>
          <Separator orientation="vertical" />
          <span>Right</span>
        </div>
      </div>
    </Section>
  );
}

export function SkeletonSection() {
  return (
    <Section title="Skeleton">
      <div className="max-w-xs space-y-2">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </Section>
  );
}

export function SpinnerSection() {
  return (
    <Section title="Spinner">
      <Row>
        <Spinner />
        <Spinner size={24} />
      </Row>
    </Section>
  );
}

export function SwitchSection() {
  return (
    <Section title="Switch">
      <Row>
        <span className="flex items-center gap-2">
          <Switch id="pv-switch-1" defaultChecked />
          <Label htmlFor="pv-switch-1">Enabled</Label>
        </span>
        <span className="flex items-center gap-2">
          <Switch id="pv-switch-2" disabled />
          <Label htmlFor="pv-switch-2">Disabled</Label>
        </span>
      </Row>
    </Section>
  );
}

export function TextareaSection() {
  return (
    <Section title="Textarea">
      <div className="max-w-md">
        <Textarea placeholder="What does this flag control?" />
      </div>
    </Section>
  );
}

export function TooltipSection() {
  return (
    <Section title="Tooltip">
      <Row>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="secondary">Hover or focus me</Button>
          </TooltipTrigger>
          <TooltipContent>Tooltips never carry information available nowhere else.</TooltipContent>
        </Tooltip>
      </Row>
    </Section>
  );
}
