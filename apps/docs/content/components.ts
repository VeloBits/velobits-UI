/**
 * Per-component editorial content: which examples a page shows, in what order,
 * and the minimal usage snippet above them.
 *
 * ## Why this is plain data and not MDX
 *
 * Everything here is consumed by `scripts/build-docs-data.ts` at build time ,
 * `usage` gets syntax-highlighted there, and every `examples[].name` is checked
 * against the files in `registry/examples/`. Both need the module to be readable
 * outside React, which rules out JSX. The cost is that prose lives in `notes` as
 * strings rather than as markup; the benefit is that a renamed example is a
 * build error naming the page, instead of a preview that silently renders
 * nothing.
 *
 * ## Everything here is optional
 *
 * A registry item with no entry still gets a complete page: title, description,
 * install commands, requirements and prop table all come from the registry and
 * the TypeScript sources. This file only adds what cannot be derived.
 *
 * The imports below are spelled for the **npm** distribution. A CLI consumer's
 * paths differ, which the page says once rather than every snippet saying it
 * twice.
 */

export interface ContentExample {
  /** A file in `apps/docs/registry/examples/`, without the extension. */
  name: string;
  title?: string;
  description?: string;
}

export interface ComponentContent {
  /** Import line plus the smallest JSX that shows the component working. */
  usage?: string;
  /** Display order. The first is the hero preview under the page title. */
  examples?: ContentExample[];
  /** Extra paragraphs under the description. Plain text, one per paragraph. */
  notes?: string[];
}

export const COMPONENT_CONTENT: Record<string, ComponentContent> = {
  /* ── Getting started ───────────────────────────────────────────────────── */

  velobits: {
    usage: `import { VelobitsProvider, Button } from '@velobitsio/ui';

export function App() {
  return (
    <VelobitsProvider storageKey="my-app.theme">
      <Button variant="primary">Create flag</Button>
    </VelobitsProvider>
  );
}`,
    notes: [
      'You own the files afterwards, so the way to slim this down is to delete what you do not use rather than to install piecemeal. There is no dependency to bump and no singleton , which is exactly why a module-federated app should take the npm package instead.',
    ],
  },

  'velobits-theme': {
    usage: `/* your app's CSS , one import */
@import '@velobitsio/tokens/theme.css';

/* NOT OPTIONAL: Tailwind v4 does not scan node_modules, so utilities used
   INSIDE @velobitsio/ui are never generated and components arrive unstyled. */
@source "../node_modules/@velobitsio/ui/dist";`,
    notes: [
      'Installing this item writes every semantic token into your CSS as light and dark custom properties. It is a dependency of every component that paints a glass surface, so the CLI pulls it in whether or not you ask for it by name.',
      'Colors renders the whole gate , every measured pair, every soft-chip composite and every perceptibility floor , computed at build time by the same functions CI uses.',
    ],
  },

  'velobits-provider': {
    usage: `import { VelobitsProvider, THEME_STORAGE_KEYS } from '@velobitsio/ui';

<VelobitsProvider storageKey={THEME_STORAGE_KEYS.dashboard}>
  {children}
</VelobitsProvider>`,
    examples: [
      {
        name: 'velobits-provider-demo',
        title: 'One provider, three responsibilities',
        description:
          'ThemeProvider, TooltipProvider and MotionConfig reducedMotion="user". The Tooltip below needs no provider of its own because this one supplies it.',
      },
    ],
    notes: [
      'Mount it once, at the shell root. A second instance means a second TooltipProvider context , which under Module Federation is exactly the singleton violation the npm distribution exists to avoid.',
    ],
  },

  /* ── Primitives ────────────────────────────────────────────────────────── */

  'glass-surface': {
    usage: `import { GlassSurface } from '@velobitsio/ui';

<GlassSurface tier="surface" className="rounded-lg p-4">
  Tier S , the component-surface material.
</GlassSurface>`,
    examples: [
      {
        name: 'glass-surface-demo',
        title: 'The three tiers',
        description:
          'Tier S ships without backdrop-filter , `blur` is the opt-in, so a twenty-card grid does not mount twenty blur layers.',
      },
    ],
    notes: [
      'The nesting rule is the one that actually catches people: two instances of the same tier composite about 2/255 apart, so both layers disappear. Every surface-bearing component takes a `surface` prop for this reason , reach for it rather than a bg-* utility, which wins the cascade and takes the material with it.',
    ],
  },

  card: {
    usage: `import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@velobitsio/ui';

<Card>
  <CardHeader>
    <CardTitle>Production</CardTitle>
    <CardDescription>12 flags enabled</CardDescription>
  </CardHeader>
  <CardContent>…</CardContent>
</Card>`,
    examples: [
      {
        name: 'card-demo',
        title: 'Glass and panel',
        description:
          'surface="panel" is the opt-out , a prop, never a bg-* utility, which would win the cascade and take the material with it.',
      },
    ],
  },

  alert: {
    usage: `import { Alert, AlertTitle, AlertDescription } from '@velobitsio/ui';

<Alert variant="warning">
  <AlertTriangleIcon />
  <AlertTitle>Partial rollout</AlertTitle>
  <AlertDescription>This flag is enabled for 40% of users.</AlertDescription>
</Alert>`,
    examples: [
      {
        name: 'alert-demo',
        title: 'Every variant',
        description:
          'Colour is never the only signal , each variant carries its meaning in words as well. The `surface` axis applies to the neutral variant only; the status washes are utilities and would beat .glass-surface.',
      },
    ],
    notes: [
      'Defaults to a polite role="status". Escalate to role="alert" deliberately, and only for something the reader must hear about immediately , an assertive live region interrupts whatever a screen reader was saying.',
    ],
  },

  button: {
    usage: `import { Button } from '@velobitsio/ui';

<Button variant="primary">Create flag</Button>`,
    examples: [
      { name: 'button-demo', title: 'Variants' },
      { name: 'button-sizes', title: 'Sizes' },
      {
        name: 'button-with-icon',
        title: 'With an icon, loading, disabled',
        description:
          'An icon child is spaced by the component; no wrapper span and no margin utility at the call site.',
      },
    ],
    notes: [
      'The measurement behind that: #007ACC is 3.90:1 on the cream page. Fine as a fill behind white text at 4.51:1, a failure as text. --primary-text is the AA-safe blue step and is what `link` paints.',
    ],
  },

  badge: {
    usage: `import { Badge } from '@velobitsio/ui';

<Badge variant="success">Live</Badge>`,
    examples: [
      {
        name: 'badge-demo',
        title: 'Every variant',
        description:
          'Each soft wash pairs with its matching text token, never with the solid fill. All the soft pairings are gated over the page, the panel and the glass composite, in both themes.',
      },
    ],
  },

  input: {
    usage: `import { Input } from '@velobitsio/ui';

<Input type="search" placeholder="Search flags…" aria-label="Search flags" />`,
    examples: [{ name: 'input-demo', title: 'States' }],
    notes: [
      'That is the half of the border palette 1.4.11 actually gates: a control boundary must clear 3:1 against what it sits on, while a purely decorative rule need not , which is why --border and --field-border are two tokens and not one.',
    ],
  },

  textarea: {
    usage: `import { Textarea } from '@velobitsio/ui';

<Textarea placeholder="What does this flag control?" />`,
    examples: [
      {
        name: 'textarea-demo',
        title: 'Grows with its content',
        description: 'field-sizing-content , it grows with what is typed into it.',
      },
    ],
  },

  'native-select': {
    usage: `import { NativeSelect } from '@velobitsio/ui';

<NativeSelect aria-label="Environment" defaultValue="prod">
  <option value="dev">Development</option>
  <option value="prod">Production</option>
</NativeSelect>`,
    examples: [{ name: 'native-select-demo', title: 'Basic' }],
    notes: [
      'The platform picker is also what a phone and a screen reader handle best, so the testability argument and the accessibility one point the same way here , which is rarer than it sounds.',
    ],
  },

  checkbox: {
    usage: `import { Checkbox, Label } from '@velobitsio/ui';

<Checkbox id="archived" defaultChecked />
<Label htmlFor="archived">Show archived</Label>`,
    examples: [
      {
        name: 'checkbox-demo',
        title: 'Checked, indeterminate, disabled',
        description:
          'The indeterminate state is what a bulk-selection header needs , `checked="indeterminate"`, not a separate prop.',
      },
    ],
  },

  switch: {
    usage: `import { Switch, Label } from '@velobitsio/ui';

<Switch id="auto" defaultChecked />
<Label htmlFor="auto">Enabled in Production</Label>`,
    examples: [{ name: 'switch-demo', title: 'Basic' }],
    notes: [
      'A switch applies immediately , that is what distinguishes it from a checkbox, which stages a change until a form is submitted. If your change needs a Save button, you want a Checkbox.',
    ],
  },

  slider: {
    usage: `import { Slider } from '@velobitsio/ui';

<span id="size-label">Size</span>
<Slider
  aria-labelledby="size-label"
  value={size}
  onValueChange={setSize}
  min={8}
  max={128}
  formatValue={(value) => \`\${value} pixels\`}
/>`,
    examples: [{ name: 'slider-demo', title: 'Single value, range, and disabled' }],
    notes: [
      'The name goes on the THUMB, and this is the one thing to get right. Radix renders the root as a <span> and puts role="slider", tabindex and aria-valuenow on each thumb , so a <label htmlFor> pointing at the root associates with nothing, and an aria-label on the root names an element that has no role while the thing a screen reader actually focuses stays anonymous. Nothing warns about either. Slider requires aria-label or aria-labelledby at the type level and forwards it onto the thumbs; the test asserts the name resolves on the element with role="slider", not merely that the attribute is present somewhere.',
      'Two thumbs need two names. Pass thumbLabels in thumb order , one shared name announces both handles identically, and a screen-reader user cannot tell which end of the range they are holding.',
      'formatValue writes aria-valuetext, which replaces the bare number in the announcement. Without it a slider says "24", and whether that is pixels, percent or items lives entirely in a visible label heard once on focus and never again through the drag.',
      'Reach for a slider only when the value is found by feel. If the useful answers are a short list of named values, a SegmentedControl or a NativeSelect beats it , and a slider you have to nudge with arrow keys to land on an exact number is a number input wearing a costume. The icon playground uses both together for exactly that reason: a dropdown names the tuned sizes, the slider explores between them.',
      'The visible thumb is 16px but its pointer target is 24px, extended by an invisible ::before at -inset-1. WCAG 2.2 §2.5.8 sets 24×24 CSS px as the minimum target, and a 24px thumb is visually heavy on a 6px track.',
    ],
  },

  label: {
    usage: `import { Label, Input } from '@velobitsio/ui';

<Label htmlFor="env">Environment name</Label>
<Input id="env" />`,
    examples: [{ name: 'label-demo', title: 'Basic' }],
    notes: [
      'Clicking the text focuses the control it names, which is behaviour you get from the element rather than from a handler , and lose the moment the root becomes a div.',
    ],
  },

  field: {
    usage: `import { Field, FieldLabel, FieldControl, FieldDescription, FieldError } from '@velobitsio/ui';

<Field error="That key is already taken">
  <FieldLabel>Flag key</FieldLabel>
  <FieldControl><Input /></FieldControl>
  <FieldDescription>Lowercase letters, digits and dashes only.</FieldDescription>
  <FieldError>That key is already taken</FieldError>
</Field>`,
    examples: [
      {
        name: 'field-demo',
        title: 'Resting and error, side by side',
        description:
          'Both ids stay in aria-describedby when a field has an error and a hint , dropping the hint on error is a common shortcut that loses the reader the rule they just broke.',
      },
    ],
  },

  avatar: {
    usage: `import { Avatar, AvatarImage, AvatarFallback } from '@velobitsio/ui';

<Avatar>
  <AvatarImage src={user.avatarUrl} alt="" />
  <AvatarFallback>{user.initials}</AvatarFallback>
</Avatar>`,
    examples: [{ name: 'avatar-demo', title: 'Image and fallback' }],
    notes: [
      'The fallback is neutral rather than the brand fill , an avatar grid is one of the few places a wall of lime would be loud.',
    ],
  },

  kbd: {
    usage: `import { Kbd } from '@velobitsio/ui';

Open the palette <Kbd>⌘</Kbd> <Kbd>K</Kbd>`,
    examples: [{ name: 'kbd-demo', title: 'Basic' }],
  },

  'scroll-area': {
    usage: `import { ScrollArea } from '@velobitsio/ui';

<ScrollArea className="h-56">
  {/* Root needs a bounded height from somewhere, or it grows and never scrolls */}
</ScrollArea>

<ScrollArea axis="x" className="w-full">
  <div className="flex gap-3">{/* wider than the box */}</div>
</ScrollArea>`,
    examples: [{ name: 'scroll-area-demo', title: 'Both axes' }],
    notes: [
      'The thumb is --field-border, where Separator is --border. A scrollbar reports position and accepts a drag, so 1.4.11 applies to it and it has to clear 3:1; a separator divides nothing a reader must perceive and is free to recede. That is what the two line tokens are for.',
      'One thumb colour covers every case: --field-border is asserted at 3:1 against both --bg and --panel, in light and dark, from a single value. So it is correct on the page and inside a panel without a variant.',
      'The track is transparent on purpose. It would be the widest block of flat colour on a long page, and filling it is most of what makes a custom scrollbar look dated.',
      'Radix moves the overflow to an inner viewport, so the Root needs a bounded height from a class, a grid track or a flex parent. Given none it grows to fit its content and never scrolls, which reads as the component being broken rather than unconstrained.',
      'Do not use it for a region whose content might fit. Radix sets the viewport to overflow: scroll the moment a scrollbar mounts, not overflow: auto, and not gated on whether anything overflows; type="auto" only governs when the bar is visible. A short list then captures the wheel, the page does not move, and it lurches when the scroll chain reaches the document. That is why this site scrolls its sidebar and its On this page columns with plain overflow-y-auto rather than with this component.',
      'Choose axes with axis: "y" (the default), "x" or "both". Do not pass ScrollBar as a child to get a second axis. Children render inside the viewport, so a bar passed that way sits in the scrolling content and slides away with the very thing it is measuring, which looks exactly like a scrollbar that is stuck.',
      'axis also decides which axes scroll at all. Radix turns the viewport overflow on per axis according to whether a scrollbar for it is mounted, so the default leaves overflow-x hidden instead of allowing silent sideways drift.',
    ],
  },

  separator: {
    usage: `import { Separator } from '@velobitsio/ui';

<Separator />
<Separator orientation="vertical" />`,
    examples: [{ name: 'separator-demo', title: 'Both orientations' }],
    notes: [
      'The exemption is recorded rather than assumed: a rule that separates nothing a reader must perceive does not need to clear 3:1, and Colors lists it beside every other exempt token with its reason.',
    ],
  },

  skeleton: {
    usage: `import { Skeleton } from '@velobitsio/ui';

<Skeleton className="h-9 w-full" />`,
    examples: [{ name: 'skeleton-demo', title: 'A loading block' }],
    notes: [
      'Painted on --highlight, not --bg2. In dark mode --bg2 IS --panel, so the obvious fill was 0/255 inside any dark panel: invisible, in exactly the place skeletons are used.',
    ],
  },

  spinner: {
    usage: `import { Spinner } from '@velobitsio/ui';

<Spinner size={16} />`,
    examples: [{ name: 'spinner-demo', title: 'Sizes, and inside a button' }],
  },

  tooltip: {
    usage: `import { Tooltip, TooltipTrigger, TooltipContent } from '@velobitsio/ui';

<Tooltip>
  <TooltipTrigger asChild>
    <Button variant="secondary">Hover me</Button>
  </TooltipTrigger>
  <TooltipContent>Evaluated at request time.</TooltipContent>
</Tooltip>`,
    examples: [{ name: 'tooltip-demo', title: 'On a button and an icon button' }],
    notes: [
      'Never the only source of a piece of information: a tooltip does not appear on touch, and it is not reachable at all by a pointer that never hovers.',
      'VelobitsProvider supplies the required provider, which is most of why it is mounted at the shell root rather than per feature.',
    ],
  },

  /* ── Overlays ──────────────────────────────────────────────────────────── */

  dialog: {
    usage: `import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle } from '@velobitsio/ui';

<Dialog>
  <DialogTrigger asChild><Button>Create flag</Button></DialogTrigger>
  <DialogContent focusFirstField>
    <DialogHeader><DialogTitle>Create flag</DialogTitle></DialogHeader>
    …
  </DialogContent>
</Dialog>`,
    examples: [
      {
        name: 'dialog-demo',
        title: 'A creation dialog, with a picker inside it',
        description:
          'Focus is trapped while open, Escape closes, and focus returns to the trigger. The environment picker opens on the ELEVATED tier , glass stacked on glass, plum-tinted in dark so it does not sink into the dialog beneath.',
      },
    ],
    notes: [
      'The browser honours autoFocus and Radix’s FocusScope then overrides it on mount, which is why the prop exists at all rather than being something you can pass through.',
    ],
  },

  'side-panel': {
    usage: `import { SidePanel, SidePanelTrigger, SidePanelContent, SidePanelHeader, SidePanelTitle } from '@velobitsio/ui';

<SidePanel>
  <SidePanelTrigger asChild><Button>Open detail</Button></SidePanelTrigger>
  <SidePanelContent>
    <SidePanelHeader><SidePanelTitle>new-checkout</SidePanelTitle></SidePanelHeader>
    …
  </SidePanelContent>
</SidePanel>`,
    examples: [{ name: 'side-panel-demo', title: 'The anchored reading sheet' }],
    notes: [
      'Deliberately NOT a Dialog variant. The two differ in where focus lands on open , a reading sheet does not steal it, a form modal must , and that is not something a `side` prop can carry honestly. Do not merge them.',
    ],
  },

  popover: {
    usage: `import { Popover, PopoverTrigger, PopoverContent, PopoverTitle } from '@velobitsio/ui';

<Popover>
  <PopoverTrigger asChild><Button>Rollout</Button></PopoverTrigger>
  <PopoverContent>
    <PopoverHeader><PopoverTitle>Rollout</PopoverTitle></PopoverHeader>
    …
  </PopoverContent>
</Popover>`,
    examples: [{ name: 'popover-demo', title: 'Anchored and non-modal' }],
    notes: [
      'It is the elevated tier , glass stacked on glass , which is the one composite in the system no automated gate measures, because a `tier="elevated"` surface sitting on the page forms a different composite from the one that matters. The Dialog page nests a real one, which is where that gets checked.',
    ],
  },

  'dropdown-menu': {
    usage: `import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@velobitsio/ui';

<DropdownMenu>
  <DropdownMenuTrigger asChild><Button>Actions</Button></DropdownMenuTrigger>
  <DropdownMenuContent align="start">
    <DropdownMenuItem>Edit</DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>`,
    examples: [
      {
        name: 'dropdown-menu-demo',
        title: 'Items, checkboxes, a radio group and a submenu',
        description:
          'Highlighting is data-[highlighted], never :hover , Radix drives keyboard focus through it, so pointer and keyboard must look identical.',
      },
    ],
    notes: [
      'Cannot host a text input. A menu traps typing for its own typeahead, so a field inside it never receives the keystrokes , reach for Dialog or Popover.',
    ],
  },

  toast: {
    usage: `import { ToastProvider, Toast, ToastTitle, ToastDescription, ToastViewport } from '@velobitsio/ui';

<ToastProvider>
  <Toast variant="success">
    <ToastTitle>Flag saved</ToastTitle>
    <ToastDescription>new-checkout is live.</ToastDescription>
  </Toast>
  <ToastViewport />
</ToastProvider>`,
    examples: [{ name: 'toast-demo', title: 'Success and danger' }],
    notes: [
      'Swipe direction defaults to `down`, not `right`: the viewport sits at the inline end, so a rightward swipe would push the toast further off screen rather than dismissing it.',
    ],
  },

  'command-palette': {
    usage: `import { CommandDialog, CommandInput, CommandList, CommandItem } from '@velobitsio/ui';

<CommandDialog open={open} onOpenChange={setOpen} shortcut="k">
  <CommandInput placeholder="Search…" />
  <CommandList>
    <CommandItem>New flag</CommandItem>
  </CommandList>
</CommandDialog>`,
    examples: [{ name: 'command-palette-demo', title: 'Opened from a button, or ⌘J' }],
    notes: [
      'This page is the proof of why that is opt-in: the docs site binds ⌘K for its own search, so the demo below takes ⌘J instead. Two listeners on one chord means whichever mounted last wins.',
    ],
  },

  /* ── Composites ────────────────────────────────────────────────────────── */

  'app-shell': {
    usage: `import { AppShell, AppShellHeader, AppShellSidebarTrigger } from '@velobitsio/ui';

<AppShell
  sidebarLabel="Control plane"
  header={<AppShellHeader><AppShellSidebarTrigger />…</AppShellHeader>}
  sidebar={<nav>…</nav>}
>
  {children}
</AppShell>`,
    examples: [
      {
        name: 'app-shell-demo',
        title: 'The authenticated chrome',
        description:
          'Embedded at a fixed height. The header is Tier-O glass, the rail is Tier S , scroll the main region and watch content pass behind the blur.',
      },
    ],
    notes: [
      'The drawer below md is a real SidePanel rather than a hand-rolled one, which is what buys the focus trap and , the part hand-rolled drawers miss , focus restoration to the hamburger that opened it.',
    ],
  },

  'data-table': {
    usage: `import { DataTable, useRowSelection } from '@velobitsio/ui';

<DataTable
  label="Flags"
  columns={columns}
  rows={rows}
  rowKey={(row) => row.id}
  context={context}
/>`,
    examples: [
      {
        name: 'data-table-demo',
        title: 'Sorting, filtering, selection and row activation',
        description:
          'Selection is DERIVED , the stored set intersected with the rows on screen , so filter the list while rows are selected and the count follows. A bulk action can never point at a row nobody can see.',
      },
    ],
    notes: [
      'This is the shape the dashboard’s flags table arrived at independently, which is why it is here rather than TanStack: adopting TanStack would cost roughly 14 kB for the grouping and pivoting no VeloBits surface does. A surface that needs virtualisation should use TanStack directly on Table.',
      '`context` must be memoised. The rows are memo-compared against it, so a fresh object per render makes the memo dead code , and the symptom is not a crash, it is a filter box that stutters at a hundred rows.',
    ],
  },

  table: {
    usage: `import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@velobitsio/ui';

<Table>
  <TableHeader><TableRow><TableHead>Environment</TableHead></TableRow></TableHeader>
  <TableBody><TableRow><TableCell>Production</TableCell></TableRow></TableBody>
</Table>`,
    examples: [
      {
        name: 'table-demo',
        title: 'On the page, and nested in a Card',
        description:
          'The wrapper carries the surface and defaults to glass. Inside a Card , already Tier S , that is the nested case, which is why `surface` is a prop.',
      },
    ],
    notes: [
      'A `border-*` utility on the container is the trap: it wins the cascade over `.glass-surface`’s own translucent edge, silently swapping the material’s border for the opaque one. Pass `surface` instead.',
    ],
  },

  form: {
    usage: `import { Form, FormField, FormError } from '@velobitsio/ui/form';

<Form {...form}>
  <form onSubmit={form.handleSubmit(create)}>
    <FormField
      control={form.control}
      name="key"
      label="Flag key"
      render={({ field }) => <Input {...field} />}
    />
    <FormError />
  </form>
</Form>`,
    examples: [
      {
        name: 'form-demo',
        title: 'Field errors and a root error',
        description:
          'Try: submit empty, then an UPPERCASE key, then the key `new-checkout` for an error that belongs to the submission rather than to a field.',
      },
    ],
    notes: [
      'Several screen readers resolve a dangling aria-describedby id by announcing nothing at all , error included. That is the failure the props-not-children shape exists to make impossible, and it is why it is worth the asymmetry with every other component here.',
      'FormError reads through useFormState, never useFormContext().formState. The latter is a Proxy recording which fields the CALLER of useForm subscribed to, so through context the reader never re-renders: it paints correctly once and then never updates, which passes a casual test.',
    ],
  },

  accordion: {
    usage: `import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '@velobitsio/ui';

<Accordion type="single" collapsible>
  <AccordionItem value="what">
    <AccordionTrigger>What is a flag?</AccordionTrigger>
    <AccordionContent>A named switch.</AccordionContent>
  </AccordionItem>
</Accordion>`,
    examples: [{ name: 'accordion-demo', title: 'Single and multiple' }],
    notes: [
      'Radix unmounts collapsed panels. A surface that needs its answers crawlable wants a hand-rolled aria-hidden + inert version instead.',
    ],
  },

  tabs: {
    usage: `import { Tabs, TabsList, TabsTrigger, TabsContent } from '@velobitsio/ui';

<Tabs defaultValue="targeting">
  <TabsList>
    <TabsTrigger value="targeting">Targeting</TabsTrigger>
  </TabsList>
  <TabsContent value="targeting">…</TabsContent>
</Tabs>`,
    examples: [{ name: 'tabs-demo', title: 'The default and the line variant' }],
    notes: [
      'The inactive trigger is text-muted-foreground. The obvious spelling , foreground at 60% , measures about 3:1, which is under AA for text.',
    ],
  },

  'segmented-control': {
    usage: `import { SegmentedControl } from '@velobitsio/ui';

<SegmentedControl
  aria-label="Environment"
  value={env}
  onValueChange={setEnv}
  options={[{ value: 'dev', label: 'Development' }]}
/>`,
    examples: [
      {
        name: 'segmented-control-demo',
        title: 'Disabled and toned segments',
        description:
          'Segments are role="radio" in a role="radiogroup", so arrow keys move the selection.',
      },
    ],
    notes: [
      'So a dangling id is the caller’s to notice: passing `aria-labelledby` pointing at nothing produces a control with no accessible name, and nothing here can detect that for you.',
    ],
  },

  'status-chip': {
    usage: `import { StatusChip } from '@velobitsio/ui';

<StatusChip status="partial">40%</StatusChip>`,
    examples: [
      {
        name: 'status-chip-demo',
        title: 'Five statuses, and the label override',
        description:
          'Every status ships a DISTINCT glyph. Colour alone fails 1.4.1, and on-versus-off is the distinction a control plane exists to make unambiguous.',
      },
    ],
  },

  'empty-state': {
    usage: `import { EmptyState } from '@velobitsio/ui';

<EmptyState
  icon={<FlagIcon />}
  title="No flags yet"
  description="Flags let you switch behaviour at runtime."
/>`,
    examples: [
      {
        name: 'empty-state-demo',
        title: 'Page-level, and inside a table body',
        description:
          'The only surface-bearing component that defaults to surface="none", and the default is the point: its documented homes are already glass.',
      },
    ],
    notes: [
      'Set `headingLevel` when the empty state IS the page , at that point it is the section heading, and a <p> leaves a gap in the outline.',
    ],
  },

  pagination: {
    usage: `import { Pagination, PaginationContent, PaginationItem, PaginationLink, paginationRange } from '@velobitsio/ui';

{paginationRange({ page, pageCount }).map((slot) => …)}`,
    examples: [
      {
        name: 'pagination-demo',
        title: 'Twenty pages',
        description:
          'The range returns a CONSTANT slot count, so the control never reflows as you page through it.',
      },
    ],
    notes: [
      'The range never hides a lone page behind an ellipsis: at page 5 of 8 it renders 1 … 4 5 6 … 8, where the second ellipsis stands in for page 7 and nothing else. Both textbook bounds are covered by tests rather than by inspection.',
    ],
  },

  breadcrumb: {
    usage: `import { Breadcrumb, BreadcrumbList, BreadcrumbItem, BreadcrumbLink, BreadcrumbPage } from '@velobitsio/ui';

<Breadcrumb>
  <BreadcrumbList>
    <BreadcrumbItem><BreadcrumbLink href="/">Acme</BreadcrumbLink></BreadcrumbItem>
    <BreadcrumbSeparator />
    <BreadcrumbItem><BreadcrumbPage>new-checkout</BreadcrumbPage></BreadcrumbItem>
  </BreadcrumbList>
</Breadcrumb>`,
    examples: [{ name: 'breadcrumb-demo', title: 'With a collapsed middle' }],
    notes: [
      'Directional icons stay the caller’s job. The layout mirrors under RTL on its own, because it uses logical properties throughout , but nothing here can know that a "next" chevron should flip while a "download" arrow should not.',
    ],
  },

  'code-block': {
    usage: `import { CodeBlock } from '@velobitsio/ui';

<CodeBlock language="json" copyable label="Flag payload">
  {JSON.stringify(flag, null, 2)}
</CodeBlock>`,
    examples: [
      {
        name: 'code-block-demo',
        title: 'A payload, and a one-time secret',
        description:
          'The `terminal` variant is the theme-invariant --code / --on-code pair , a revealed secret has to be transcribed exactly, and a surface that flips changes which characters are easy to misread.',
      },
    ],
    notes: [
      'The copy button presence-checks navigator.clipboard , the whole object, not just the method , because the entire API is absent on an insecure origin, so the property access itself throws.',
    ],
  },

  'diff-viewer': {
    usage: `import { DiffViewer, diffLines } from '@velobitsio/ui';

<DiffViewer lines={diffLines(before, after)} label="Config v3 → v4" />`,
    examples: [{ name: 'diff-viewer-demo', title: 'A unified line diff' }],
    notes: [
      'The gutter is also the only channel that survives greyscale, which is the case a printed change log actually hits.',
      'The `diffLines` guard is about MEMORY, not time: LCS is O(n·m) in both, so two large files are a heap problem before they are a slow one.',
    ],
  },

  motion: {
    usage: `import { PageTransition, Stagger, StaggerItem, FadeIn } from '@velobitsio/ui/motion';

<PageTransition transitionKey={pathname}>{children}</PageTransition>`,
    examples: [
      {
        name: 'motion-demo',
        title: 'PageTransition',
        description:
          'mode="wait" serialises exit and enter. The default overlaps them, which for a full page means both routes are mounted and stacked , so the outgoing page’s focused element stays focusable while invisible.',
      },
      {
        name: 'motion-stagger',
        title: 'Stagger',
        description:
          'Each item computes its own delay from its index, clamped at STAGGER_LIMIT. Framer’s own staggerChildren cannot be capped, which is how a 200-row list takes eight seconds to arrive.',
      },
      {
        name: 'motion-fade-in',
        title: 'FadeIn',
        description:
          'For the cases that are neither a route nor a list. Deliberately has no exit animation , that needs a parent AnimatePresence and a stable key, and PageTransition is the component that owns that complexity.',
      },
    ],
    notes: [
      'Subpath-only: @velobitsio/ui/motion, never the barrel , nobody should pay for Framer’s runtime to import a Button.',
      'These components assume VelobitsProvider is mounted. Without it they still animate , and silently stop honouring the reader’s reduced-motion preference, which is the one failure mode here worth knowing about.',
      'Everything animates transform and opacity and nothing else. Both are composited on the GPU: no layout, no paint, no main-thread work per frame.',
    ],
  },

  /* ── Hooks and utilities ───────────────────────────────────────────────── */

  cn: {
    usage: `// npm
import { cn } from '@velobitsio/ui';
// shadcn CLI , installed to your utils module
import { cn } from '@/lib/utils';

cn('rounded-md px-3', isActive && 'bg-primary-soft', className)`,
    notes: [
      'Installed to your `utils` alias rather than into the velobits folder, so a project already on shadcn keeps one `cn`. Ours is a strict SUPERSET of shadcn’s: identical signature and identical results on standard utilities, plus the class groups this system needs , `rounded-pill`, the `z-*` ladder, the named durations, and a bidirectional `control-material` ⇄ `shadow` conflict group. Pass `--overwrite` so ours wins; the reverse silently leaves two box-shadows alive on one element.',
      'The signature must stay twMerge(clsx(...)). Consumers point their components.json `utils` alias at it, so a change of shape breaks every component the CLI has already written into their tree.',
    ],
  },

  theme: {
    usage: `import { themeInitScript, THEME_STORAGE_KEYS } from '@velobitsio/ui/theme';

<script dangerouslySetInnerHTML={{ __html: themeInitScript(THEME_STORAGE_KEYS.dashboard) }} />`,
    notes: [
      'React-free by design, so a Server Component can call it during render , which is what makes the blocking init script possible at all. It runs before first paint, so the correct theme is applied before React boots.',
      'Two surfaces silently sharing a default key is a bug you find in production, which is why there is no default to fall back to.',
    ],
  },

  'use-theme': {
    usage: `import { useTheme } from '@velobitsio/ui';

const { mode, theme, setMode, toggle, mounted } = useTheme();`,
    examples: [
      {
        name: 'use-theme-demo',
        title: 'Reading and setting the mode',
        description:
          '`mode` is what the user chose, including `system`. `theme` is what that currently resolves to, and is never `system`.',
      },
    ],
    notes: [
      '`mounted` is false during SSR and on the first client render. Style through the `dark` class, not through `theme` in JS , a JS branch renders the light arm on the server while the client already knows the stored value, and React discards the server HTML with #418.',
    ],
  },

  'use-media-query': {
    usage: `import { useMediaQuery } from '@velobitsio/ui';
import { breakpoint } from '@velobitsio/tokens';

const isDesktop = useMediaQuery(\`(min-width: \${breakpoint.md})\`);`,
    examples: [
      {
        name: 'use-media-query-demo',
        title: 'Live values',
        description: 'Resize the window, or turn on reduced motion in your OS settings.',
      },
    ],
    notes: [
      'usePrefersReducedMotion is for imperative decisions Framer cannot see , whether to autoplay, for instance. Animations are already covered by MotionConfig and the token layer.',
    ],
  },

  'use-row-selection': {
    usage: `import { useRowSelection } from '@velobitsio/ui';

const selection = useRowSelection(rows, (row) => row.id);`,
    examples: [
      {
        name: 'use-row-selection-demo',
        title: 'The selection follows the filter',
        description:
          'Select every row, then filter them away, and the count goes to zero rather than keeping a bulk action pointed at rows nobody can see.',
      },
    ],
    notes: [
      'The obvious alternative , pruning the stored set in an effect whenever the rows change , is a render behind by construction: for one commit the count says something the screen does not.',
    ],
  },
};
