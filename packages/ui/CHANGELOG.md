# @velobits-dev/ui

## 0.1.0

Initial release.

37 React components on the shared token layer, authored once in the registry
source and shipped both as this npm package and as a shadcn registry. A parity
test asserts the two never drift.

- **Tier 1 — 18 primitives.** `Alert` `Avatar` `Badge` `Button` `Card`
  `Checkbox` `Field` `GlassSurface` `Input` `Kbd` `Label` `NativeSelect`
  `Separator` `Skeleton` `Spinner` `Switch` `Textarea` `Tooltip`
- **Tier 2 — 6 overlays.** `CommandPalette` `Dialog` `DropdownMenu` `Popover`
  `SidePanel` `Toast`
- **Tier 3 — 13 composites.** `Accordion` `AppShell` `Breadcrumb` `CodeBlock`
  `DataTable` `DiffViewer` `EmptyState` `Form` `Pagination` `SegmentedControl`
  `StatusChip` `Table` `Tabs`
- Plus `cn`, `VelobitsProvider`, `useTheme`, `useMediaQuery` and
  `useRowSelection`. Dual ESM/CJS with per-condition types; every component also
  has its own subpath entry.

### Decisions worth knowing about

- **`Form` is subpath-only** — `@velobits-dev/ui/form`, never the barrel.
  `react-hook-form` is an optional peer and the barrel is a single bundled
  module, so re-exporting it would put a top-level `import 'react-hook-form'`
  into `dist/index.js` and break every consumer without forms. Bundling our own
  copy would be worse and quieter: separate module state means
  `useFormContext()` reads a different context from your `useForm()`. `Form`
  also takes `label` and `description` as props rather than children, so the
  ARIA cannot be wrong by omission.
- **`DataTable` is a column registry, not TanStack.** No VeloBits surface
  pivots, groups or resizes columns, and adopting TanStack would cost roughly
  14 kB for none of it. A surface that ever needs virtualisation should use
  TanStack directly on `Table`.
- **`EmptyState` defaults to `surface="none"`** even though `Table` and
  `Accordion` default to glass — its documented homes are a table body and a
  card body, both already glass, and defaulting it would ship nested glass at
  its commonest call site.
- **Accessibility refusals, each pinned by a test.** No `aria-selected` on a
  `DataTable` row (it is a `table`, not a `grid` — the checkbox is the
  accessible truth); no `role="link" aria-disabled` on the breadcrumb leaf,
  which announces static text as a broken link; `StatusChip` gives every status
  a distinct glyph, because colour alone fails WCAG 1.4.1.
- Logical properties throughout, so `dir="rtl"` needs no variants.

### Peers

`@velobits-dev/tokens`, `@velobits-dev/icons`, `framer-motion`, `react` and
`react-dom` are all **required**. `framer-motion` in particular is easy to miss:
the barrel imports `MotionConfig` via `VelobitsProvider`, so an install without
it fails to resolve. `react-hook-form` is the only optional peer.

### Known

The sibling peer ranges are `^0.1.0`. On a `0.x` version a caret pins the
**minor**, so a `0.2.0` release of tokens or icons will force a major bump here
until those ranges are widened.
