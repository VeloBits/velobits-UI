import {
  Alert,
  AlertDescription,
  AlertTitle,
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Card,
  CardAction,
  CardContent,
  CardDescription,
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

export const metadata = { title: 'Components — VeloBits UI' };

function Demo({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div>
        <h2 className="text-xl font-semibold">{title}</h2>
        {note && <p className="mt-1 text-sm text-muted-foreground">{note}</p>}
      </div>
      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-panel p-6">
        {children}
      </div>
    </section>
  );
}

export default function ComponentsPage() {
  return (
    <div className="space-y-12">
      <div>
        <h1 className="mt-8 mb-2 text-3xl font-semibold tracking-tight">Components</h1>
        <p className="text-muted-foreground">
          Tier 1 — the primitives that cover roughly 80% of usage. Toggle the theme in the header;
          every surface below should follow without a stale colour anywhere.
        </p>
      </div>

      <Demo
        title="Button"
        note="No variant paints --primary as text. `link` uses --primary-text, which is the AA-safe blue step."
      >
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
      </Demo>

      <Demo
        title="Badge"
        note="Soft washes pair with the matching text token, never the solid fill."
      >
        <Badge>Neutral</Badge>
        <Badge variant="primary">Primary</Badge>
        <Badge variant="brand">Brand</Badge>
        <Badge variant="success">Live</Badge>
        <Badge variant="danger">Failed</Badge>
        <Badge variant="warning">Rollout</Badge>
        <Badge variant="info">Info</Badge>
        <Badge variant="outline">Outline</Badge>
      </Demo>

      <Demo title="Card">
        <Card className="w-full max-w-sm">
          <CardHeader>
            <CardTitle>Production</CardTitle>
            <CardDescription>12 flags enabled</CardDescription>
            <CardAction>
              <Badge variant="success">Healthy</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Last deploy 4 minutes ago.
          </CardContent>
        </Card>
      </Demo>

      <Demo
        title="Alert"
        note="Colour is never the only signal — every variant expects a title in words."
      >
        <div className="w-full space-y-3">
          <Alert>
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

      <Demo title="Form primitives">
        <div className="grid w-full gap-5 sm:grid-cols-2">
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

          <div className="space-y-2">
            <Label htmlFor="env">Environment</Label>
            <NativeSelect id="env" defaultValue="prod">
              <option value="dev">Development</option>
              <option value="staging">Staging</option>
              <option value="prod">Production</option>
            </NativeSelect>
          </div>

          <div className="space-y-2">
            <Label htmlFor="desc">Description</Label>
            <Textarea id="desc" placeholder="What does this flag control?" />
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="c1" defaultChecked />
            <Label htmlFor="c1">Enable in production</Label>
          </div>

          <div className="flex items-center gap-2">
            <Checkbox id="c2" checked="indeterminate" />
            <Label htmlFor="c2">Select all (indeterminate)</Label>
          </div>

          <div className="flex items-center gap-2">
            <Switch id="s1" defaultChecked />
            <Label htmlFor="s1">Auto run</Label>
          </div>
        </div>
      </Demo>

      <Demo title="Feedback and misc">
        <Spinner />
        <Skeleton className="h-9 w-40" />
        <Avatar>
          <AvatarFallback>NS</AvatarFallback>
        </Avatar>
        <Separator orientation="vertical" className="h-8" />
        <Kbd>⌘</Kbd>
        <Kbd>K</Kbd>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="secondary">Hover me</Button>
          </TooltipTrigger>
          <TooltipContent>
            A tooltip is never the only source of information — it does not appear on touch.
          </TooltipContent>
        </Tooltip>
      </Demo>

      <Demo
        title="RTL"
        note="Logical properties throughout, so this needs no per-component work. Directional icons are still the caller's job."
      >
        <div dir="rtl" className="w-full space-y-3">
          <Card>
            <CardHeader>
              <CardTitle>لوحة التحكم</CardTitle>
              <CardAction>
                <Badge variant="success">مباشر</Badge>
              </CardAction>
            </CardHeader>
          </Card>
          <div className="flex items-center gap-2">
            <Switch id="rtl-switch" defaultChecked />
            <Label htmlFor="rtl-switch">تشغيل تلقائي</Label>
          </div>
        </div>
      </Demo>
    </div>
  );
}
