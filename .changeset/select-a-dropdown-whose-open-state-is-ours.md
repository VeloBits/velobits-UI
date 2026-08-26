---
'@velobitsio/ui': minor
---

Added `Select`, and moved every dropdown in the system onto it. A native
`<select>` can be styled to the pixel while it is **closed** and not at all while
it is **open** , the option popup is drawn by the operating system's widget
layer, so there is no radius, no shadow, no padding, no check indicator, no enter
animation, and on Chromium a fill inherited from the control's own `background`.
Every dropdown in these docs looked finished until the moment someone clicked it.

```tsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@velobitsio/ui';

<Select defaultValue="prod">
  <SelectTrigger aria-label="Environment">
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="dev">Development</SelectItem>
    <SelectItem value="prod">Production</SelectItem>
  </SelectContent>
</Select>;
```

Tier-O glass panel, check indicator in a reserved logical gutter, `bg-highlight`
rows, scale-from-trigger enter, `SelectGroup` / `SelectLabel` / `SelectSeparator`,
and a `size` variant (`default` = the `Input` height, `sm` = the toolbar height).
Migrated: `CodeBlock`'s language switcher, the docs code-panel switcher, the icon
playground's size and motion pickers, and the form/dialog/popover demos.

**`NativeSelect` is kept and is not deprecated.** It is the right control when the
platform's own picker IS the design , a mobile-first form, where iOS renders a
wheel and Android a full-screen list , or when a control has to survive with no
JS. Its docblock now says which of the two to reach for instead of forbidding
this one.

## ADR-0031's refusal of Radix Select has expired, on evidence

That ADR declined `@radix-ui/react-select` because it is undriveable under
happy-dom: it measures the trigger and viewport to place its popper, and in a DOM
with no layout every option lands at 0×0. True of the environment it was written
against, not of this package. `test/setup.ts` already polyfills
`ResizeObserver`, `Element.prototype.scrollIntoView` and
`getAnimations`, which is the whole of what Radix needs here, and
`test/select.test.tsx` now drives the full contract , open, `listbox`/`option`
roles, `aria-selected`, selection by click AND Enter, arrow traversal, disabled
items, placeholder, controlled value, the hidden native control for a form post,
and axe on the open panel. No new dependency: `@radix-ui/react-select` already
ships inside `radix-ui`.

Two conditions made it work, and both are load-bearing:

- **`position="popper"`.** The default `item-aligned` is the mode that measures
  the selected item's offset so the current value sits over the trigger; with no
  layout it collapses. `popper` anchors below the trigger, which is also what the
  design wanted, so this is not a testing concession.
- **Arrow keys need `userEvent.keyboard`, not `fireEvent.keyDown`.** Radix
  resolves the next candidate from `event.target`; a bare `fireEvent` on the
  listbox targets the listbox, which is not a collection member, so the handler
  finds the already-focused item first and moves nothing. A property of the
  synthetic event, not of the environment , and exactly the false negative that
  gets a working primitive written off.

## Three traps this component encodes

⚠️ **The chevron cannot read its own open state.** `SelectPrimitive.Icon` renders
`<span aria-hidden>{children}</span>` and forwards no `data-state`, so a
`data-[state=open]:rotate-180` written on the icon compiles to a valid rule that
can never match: nothing throws, nothing warns, the chevron silently never turns.
It reads the state off the trigger through a named group, as `AccordionTrigger`
does.

⚠️ **`flex flex-col` on the content IS the scroll mechanism.** Radix gives the
viewport `flex: 1` and `overflow: hidden auto` as inline styles. In a block
container that `flex: 1` is inert, the viewport grows to full content height, and
the content's `max-h` + `overflow-hidden` **clips** the tail rather than
scrolling it , with the scroll buttons sitting below the cut. Only long lists
break, which is why it has a test rather than a comment.

⚠️ **The panel is `z-popover` (1300), not `z-dropdown` (1000).** It portals to the
body, so a Select opened from inside a `Popover` is that popover's **sibling**,
not its child, and z-index alone decides the paint order , at 1000 the panel
disappears behind an opaque glass surface while still holding focus. Inside a
`Dialog` (1200) the same thing happens one rung lower. It ties with Popover at
1300 and the tiebreak is tree order: measured on the built site, the popover
portal is body child 11 and the Select's is 12, and the Select is always later
because it cannot open before the surface holding its trigger exists.
`DropdownMenu` has the same latent problem at `z-dropdown`; do not "fix" this by
matching it.

## Budgets

`@radix-ui/react-select` adds **4.99 kB** brotlied to the barrel with
dependencies (70.8 kB → 75.8 kB), so that budget moves 72 kB → 80 kB. Two new
per-entry budgets record the rest: `dist/select.js` is 1.47 kB of our own code
and 36.2 kB with the popper, which is what a consumer importing only `Select`
pays.
