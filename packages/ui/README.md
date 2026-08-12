# @velobits/ui

The VeloBits React component library — 38 components sharing one token layer and
one glass material.

Authored once and shipped twice: as this npm package, and as a shadcn registry
served from the same source. A parity test stops the two drifting.

## Install

```bash
npm install @velobits/ui @velobits/tokens @velobits/icons framer-motion
```

**`framer-motion` is a required peer**, not an optional one — the barrel imports
`MotionConfig` through `VelobitsProvider`, so an install without it fails to
resolve. React and React DOM 19 or later are also peers.

`react-hook-form` is the one **optional** peer. It is needed only by `Form`; see
below.

## Set up

```css
@import '@velobits/tokens/theme.css';
@source "../node_modules/@velobits/ui/dist";
```

The `@source` line is not optional. Tailwind v4 does not scan `node_modules`, so
without it every class this package ships is stripped from your build.

Then wrap your app once:

```tsx
import { VelobitsProvider } from '@velobits/ui';

<VelobitsProvider>{children}</VelobitsProvider>;
```

That supplies the theme, the tooltip provider and the reduced-motion config.

## What's in it

**Tier 1 — primitives (18).** `Alert` `Avatar` `Badge` `Button` `Card`
`Checkbox` `Field` `GlassSurface` `Input` `Kbd` `Label` `NativeSelect`
`Separator` `Skeleton` `Spinner` `Switch` `Textarea` `Tooltip`

**Tier 2 — overlays (6).** `CommandPalette` `Dialog` `DropdownMenu` `Popover`
`SidePanel` `Toast`

**Tier 3 — composites (13).** `Accordion` `AppShell` `Breadcrumb` `CodeBlock`
`DataTable` `DiffViewer` `EmptyState` `Form` `Pagination` `SegmentedControl`
`StatusChip` `Table` `Tabs`

Plus `cn`, `useTheme`, `useMediaQuery` and `useRowSelection`. Every component is
also available on its own subpath — `@velobits/ui/button` — if you would
rather not rely on the barrel tree-shaking.

## `Form` is subpath-only

```tsx
import { Form, FormField } from '@velobits/ui/form';
```

It is deliberately absent from the barrel. `react-hook-form` is an optional
peer, and the barrel is one bundled module, so re-exporting `Form` would put a
top-level `import 'react-hook-form'` into `dist/index.js` and break every
consumer that has no forms. Bundling our own copy instead would be worse and
quieter — it would carry its own module state, so `useFormContext()` would read
a different context from your `useForm()`.

Note that `Form` takes `label` and `description` as **props**, not children, so
the `aria-describedby` wiring cannot be wrong by omission.

## The glass material has rules

- **Never nest glass.** Two instances of one tier composite about 2/255 apart
  and cancel each other out. A `Card` inside a glass panel wants
  `surface="panel"`.
- **Never put `bg-*`, `shadow-*` or `border-*` utilities on a Tier-S component.**
  `.glass-surface` lives in the `components` layer, so your utility wins and
  silently destroys the material. Use the `surface` prop instead.
- Tier S carries **no `backdrop-filter`** by default, so a 20-card grid does not
  mount 20 blur layers. `.glass-surface-blur` is the opt-in. Keep live blur
  layers to roughly 6.
- A `backdrop-filter` creates a containing block for `position: fixed`
  descendants. A fixed child of a glass ancestor is trapped inside it.

## Licence

Proprietary. See [LICENSE](./LICENSE). Published publicly for VeloBits' own
build pipelines; this is not an offer of licence.
