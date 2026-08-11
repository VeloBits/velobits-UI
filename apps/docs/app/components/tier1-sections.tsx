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
  GlassSurface,
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
import { AlertTriangleIcon, FlagIcon, SearchIcon, TrashIcon } from '@velobits-dev/icons';

import { Demo, Row } from '../section';

/*
 * Tier 1 — the 18 primitives, ordered material-first rather than alphabetically.
 * GlassSurface, Card and Alert lead because they are what the system looks like;
 * the controls follow.
 *
 * BLUR BUDGET: GlassSurfaceDemo mounts three live backdrop layers (surface+blur,
 * overlay, elevated). With the site header and the AppShell demo's header that
 * is 5 on this page at rest, against a documented cap of ~6. Anything added here
 * that blurs has to displace one of them.
 */

export function GlassSurfaceDemo() {
  return (
    <Demo
      title="GlassSurface"
      note="The raw material, one swatch per tier. Tier S ships without backdrop-filter — `blur` is the opt-in, and these three swatches are three of this page's five live blur layers."
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <GlassSurface tier="surface" className="rounded-lg p-4 text-sm">
          <p className="font-medium">tier=&quot;surface&quot;</p>
          <p className="mt-1 text-muted-foreground">Tier S. Tint, edge and elevation. No blur.</p>
        </GlassSurface>
        <GlassSurface tier="surface" blur className="rounded-lg p-4 text-sm">
          <p className="font-medium">tier=&quot;surface&quot; blur</p>
          <p className="mt-1 text-muted-foreground">
            Tier S with the blur opted in. For a sticky bar, not a card grid.
          </p>
        </GlassSurface>
        <GlassSurface tier="overlay" className="rounded-lg p-4 text-sm">
          <p className="font-medium">tier=&quot;overlay&quot;</p>
          <p className="mt-1 text-muted-foreground">
            Tier O — the default. Always blurred; muted text steps up.
          </p>
        </GlassSurface>
        <GlassSurface tier="elevated" className="rounded-lg p-4 text-sm">
          <p className="font-medium">tier=&quot;elevated&quot;</p>
          <p className="mt-1 text-muted-foreground">
            Tier O stacked on Tier O. Plum-tinted in dark so it clears the overlay below.
          </p>
        </GlassSurface>
      </div>
    </Demo>
  );
}

export function CardDemo() {
  return (
    <Demo
      title="Card"
      note='Tier-S glass by default. `surface="panel"` is the opt-out — a prop, never a bg-* utility, which would win the cascade and take the material with it.'
    >
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
            The archetypal Tier-S surface, with the page as its backdrop — which is the backdrop the
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
            <CardDescription>surface=&quot;panel&quot; — the opaque original</CardDescription>
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
    </Demo>
  );
}

export function AlertDemo() {
  return (
    <Demo
      title="Alert"
      note="Colour is never the only signal — every variant carries a title in words. The `surface` axis applies to the neutral variant only; the status washes are utilities and would beat .glass-surface."
    >
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
    </Demo>
  );
}

export function ButtonDemo() {
  return (
    <Demo
      title="Button"
      note="No variant paints --primary as text — it measures 3.90:1 on cream. `link` uses --primary-text, the AA-safe blue step."
    >
      <Row>
        <Button variant="primary">Primary</Button>
        <Button variant="brand">Brand</Button>
        <Button variant="secondary">Secondary</Button>
        <Button variant="ghost">Ghost</Button>
        <Button variant="destructive">Delete</Button>
        <Button variant="link">Docs</Button>
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
        <Button variant="primary">
          <FlagIcon />
          With icon
        </Button>
      </Row>
    </Demo>
  );
}

export function BadgeDemo() {
  return (
    <Demo
      title="Badge"
      note="Each soft wash pairs with its matching text token, never the solid fill. All six pairings are gated over the page, the panel and BOTH sheen stops of the glass composite, in both themes. `info` is teal, not blue — it used to be byte-identical to the link colour, so an info chip and a hyperlink could not be told apart. `rose` is the one variant that asserts no severity: reach for it when the axis is a category rather than a status."
    >
      <Row>
        <Badge>Neutral</Badge>
        <Badge variant="primary">Primary</Badge>
        <Badge variant="brand">Brand</Badge>
        <Badge variant="success">Live</Badge>
        <Badge variant="danger">Failed</Badge>
        <Badge variant="warning">Rollout</Badge>
        <Badge variant="info">Inherited</Badge>
        <Badge variant="rose">string_enum</Badge>
        <Badge variant="outline">Outline</Badge>
      </Row>
    </Demo>
  );
}

export function InputDemo() {
  return (
    <Demo title="Input">
      <div className="grid max-w-2xl gap-3 sm:grid-cols-2">
        <Input placeholder="Search flags…" />
        <Input defaultValue="new-checkout" />
        <Input disabled placeholder="Disabled" />
        <Input type="search" placeholder="Type to filter" aria-label="Filter flags" />
      </div>
    </Demo>
  );
}

export function TextareaDemo() {
  return (
    <Demo title="Textarea" note="field-sizing-content — it grows with what is typed into it.">
      <div className="max-w-md">
        <Textarea placeholder="What does this flag control?" />
      </div>
    </Demo>
  );
}

export function NativeSelectDemo() {
  return (
    <Demo
      title="NativeSelect"
      note="Deliberately the native element, not a Radix Select — the platform's own picker is what a phone and a screen reader both handle best."
    >
      <div className="max-w-xs">
        <NativeSelect aria-label="Environment" defaultValue="prod">
          <option value="dev">Development</option>
          <option value="staging">Staging</option>
          <option value="prod">Production</option>
        </NativeSelect>
      </div>
    </Demo>
  );
}

export function CheckboxDemo() {
  return (
    <Demo title="Checkbox">
      <Row>
        <span className="flex items-center gap-2">
          <Checkbox id="cx-check-1" defaultChecked />
          <Label htmlFor="cx-check-1">Checked</Label>
        </span>
        <span className="flex items-center gap-2">
          <Checkbox id="cx-check-2" checked="indeterminate" />
          <Label htmlFor="cx-check-2">Select all (indeterminate)</Label>
        </span>
        <span className="flex items-center gap-2">
          <Checkbox id="cx-check-3" disabled />
          <Label htmlFor="cx-check-3">Disabled</Label>
        </span>
      </Row>
    </Demo>
  );
}

export function SwitchDemo() {
  return (
    <Demo title="Switch">
      <Row>
        <span className="flex items-center gap-2">
          <Switch id="cx-switch-1" defaultChecked />
          <Label htmlFor="cx-switch-1">Enabled in Production</Label>
        </span>
        <span className="flex items-center gap-2">
          <Switch id="cx-switch-2" disabled />
          <Label htmlFor="cx-switch-2">Disabled</Label>
        </span>
      </Row>
    </Demo>
  );
}

export function LabelDemo() {
  return (
    <Demo title="Label" note="Clicking the label focuses the control it names.">
      <div className="max-w-xs space-y-2">
        <Label htmlFor="cx-label-input">Environment name</Label>
        <Input id="cx-label-input" placeholder="staging" />
      </div>
    </Demo>
  );
}

export function FieldDemo() {
  return (
    <Demo
      title="Field"
      note="Assembles label, control, description and error into one aria-describedby. The resting and error states side by side."
    >
      <div className="grid max-w-2xl gap-5 sm:grid-cols-2">
        <Field>
          <FieldLabel>Flag key</FieldLabel>
          <FieldControl>
            <Input placeholder="new-checkout" />
          </FieldControl>
          <FieldDescription>Lowercase letters, digits and dashes only.</FieldDescription>
        </Field>
        <Field error="That key is already taken">
          <FieldLabel>Flag key</FieldLabel>
          <FieldControl>
            <Input defaultValue="new-checkout" />
          </FieldControl>
          <FieldDescription>Lowercase letters, digits and dashes only.</FieldDescription>
          <FieldError>That key is already taken</FieldError>
        </Field>
      </div>
    </Demo>
  );
}

export function AvatarDemo() {
  return (
    <Demo
      title="Avatar"
      note="The fallback is neutral, not the brand fill — an avatar grid is one of the few places a lime wall would be loud."
    >
      <Row>
        <Avatar>
          <AvatarImage src="/icon.svg" alt="" />
          <AvatarFallback>VB</AvatarFallback>
        </Avatar>
        {/* No image at all, so the fallback shows without a console 404. */}
        <Avatar>
          <AvatarFallback>NS</AvatarFallback>
        </Avatar>
        <Avatar>
          <AvatarFallback>AK</AvatarFallback>
        </Avatar>
      </Row>
    </Demo>
  );
}

export function KbdDemo() {
  return (
    <Demo title="Kbd">
      <Row>
        <span className="flex items-center gap-1 text-sm">
          Open the palette
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </span>
        <Separator orientation="vertical" className="h-5" />
        <span className="flex items-center gap-1 text-sm">
          Dismiss
          <Kbd>Esc</Kbd>
        </span>
      </Row>
    </Demo>
  );
}

export function SeparatorDemo() {
  return (
    <Demo title="Separator">
      <div className="max-w-xs space-y-3">
        <p className="text-sm">Above the rule</p>
        <Separator />
        <div className="flex h-8 items-center gap-3 text-sm">
          <span>Left</span>
          <Separator orientation="vertical" />
          <span>Right</span>
        </div>
      </div>
    </Demo>
  );
}

export function SkeletonDemo() {
  return (
    <Demo
      title="Skeleton"
      note="On --highlight, not --bg2. In dark mode --bg2 IS --panel, so the old fill was 0/255 inside any dark panel — invisible."
    >
      <div className="max-w-sm space-y-2">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
      </div>
    </Demo>
  );
}

export function SpinnerDemo() {
  return (
    <Demo title="Spinner">
      <Row>
        <Spinner />
        <Spinner size={24} />
        <Button variant="primary" disabled>
          <Spinner size={16} />
          Saving…
        </Button>
      </Row>
    </Demo>
  );
}

export function TooltipDemo() {
  return (
    <Demo
      title="Tooltip"
      note="Never the only source of a piece of information — it does not appear on touch, and it needs a TooltipProvider ancestor or it throws on first hover."
    >
      <Row>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="secondary">Hover or focus me</Button>
          </TooltipTrigger>
          <TooltipContent>Flags are evaluated at request time, not at build time.</TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button size="icon" variant="ghost" aria-label="Search">
              <SearchIcon />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Search flags</TooltipContent>
        </Tooltip>
      </Row>
    </Demo>
  );
}
