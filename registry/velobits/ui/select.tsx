'use client';

import { cva, type VariantProps } from 'class-variance-authority';
import { Select as SelectPrimitive } from 'radix-ui';

import { CheckIcon, ChevronDownIcon, ChevronUpIcon } from '@velobitsio/icons';

import { cn } from '../lib/cn';

/**
 * Radix Select on the glass overlay tier , a dropdown whose OPEN state is ours
 * to design, which is the entire reason it exists alongside `NativeSelect`.
 *
 * ## Why this exists when `NativeSelect` already did
 *
 * A native `<select>` can be styled down to the pixel while it is CLOSED and not
 * at all while it is OPEN. The option popup is drawn by the operating system's
 * own widget layer: no border-radius, no shadow, no padding, no check indicator,
 * no enter animation, and , on Chromium , a fill inherited from the select's own
 * `background`, which is the trap `native-select.tsx` documents at length. So a
 * system can ship a beautiful trigger and still have the moment the user clicks
 * look like a 2004 form. That is the gap this closes.
 *
 * ## ADR-0031 refused Radix Select, and that refusal has expired
 *
 * The stated reason was that `@radix-ui/react-select` is undriveable under
 * happy-dom , it measures the trigger and viewport to position its popper, and
 * in a DOM with no layout every option lands at 0×0. That was true of the
 * environment ADR-0031 was written against. It is not true of THIS package:
 * `test/setup.ts` polyfills `ResizeObserver`, `Element.prototype.scrollIntoView`
 * and `Element.prototype.getAnimations`, which is the whole of what Radix needs
 * here, and `test/select.test.tsx` drives the full contract , open, `listbox`
 * and `option` roles, `aria-selected`, selection by click AND by Enter, arrow
 * traversal, disabled items, placeholder, controlled value.
 *
 * Two conditions that made it work, both of which are load-bearing:
 *
 *   1. **`position="popper"`, not the default.** `item-aligned` (the default)
 *      positions the viewport by measuring the selected item's offset inside it
 *      so the current value sits over the trigger. With no layout every
 *      measurement is 0 and the panel collapses. `popper` anchors the panel
 *      BELOW the trigger like a menu , which is also what the design calls for,
 *      so this is not a testing concession.
 *   2. **Arrow keys need `userEvent.keyboard`, not `fireEvent.keyDown`.** Radix
 *      resolves the next candidate from `event.target`; a bare `fireEvent` on
 *      the listbox targets the listbox, which is not in the item collection, so
 *      the handler finds the already-focused item first and returns. This is a
 *      property of the synthetic event, not of the environment.
 *
 * `NativeSelect` is NOT deprecated by this. It stays the right control for a
 * mobile-first form, where the platform picker (a wheel on iOS, a full-screen
 * list on Android) beats any panel we can draw, and for a `<form>` post that
 * wants a real `<select>` in the payload. Radix renders a visually-hidden native
 * `<select>` of its own when `name` is set, so this works in a form too , but if
 * the native picker IS the design, reach for `NativeSelect`.
 *
 * ## Layering, and why the Portal is not optional
 *
 * `backdrop-filter` forms a stacking context AND a containing block for
 * `position: fixed` descendants. A Select rendered inside a glass Card or
 * `DialogContent` without portalling would be trapped in that panel's box and
 * clipped by it, whatever its z-index said. `SelectContent` therefore always
 * portals to the body.
 *
 * ## `z-popover` (1300), NOT `z-dropdown` (1000), and this is not a preference
 *
 * The rung is decided by the lowest surface the panel must clear, and for this
 * control that is a Popover. `Select` is used inside `PopoverContent` on two docs
 * demos and in real filter panels, and both portal to the same place , the body ,
 * so they are siblings in the ROOT stacking context and z-index alone decides
 * which paints on top. At `z-dropdown` the panel loses to the popover it was
 * opened from and disappears behind an opaque glass surface. Not clipped, not
 * offset: gone, while still holding focus. Inside a `Dialog` (1200) the same
 * thing happens one rung lower.
 *
 * `z-popover` is the rung that already means "anchored panel that must clear a
 * modal" , that is exactly why `PopoverContent` is there , and this is the same
 * kind of thing. Nothing is lost by sharing it: Radix Select is MODAL, so while
 * the panel is open the page is inert and no other layer can be opened over it.
 * The only surfaces that can be on screen beneath it are the ones its own trigger
 * lives on. `toast` (1400) and `tooltip` (1500) stay above, which is correct , a
 * toast must be seen even over an open dropdown.
 *
 * ⚠️ **Sharing the rung with Popover is a TIE, and the tiebreak is paint order.**
 * Measured on the built docs site: with a Select open inside a Popover, both
 * compute `z-index: 1300` and both are direct children of `<body>` , the popover
 * portal at index 11, the Select's at 12. Equal z-index in one stacking context
 * is resolved by tree order, so the later node wins, and the Select is always the
 * later node because it cannot open before the surface holding its trigger
 * exists. That is why the tie is safe rather than lucky. What would break it is
 * giving `PopoverContent` a HIGHER rung than this one; if that ever happens, this
 * needs its own rung above it, not a nudge.
 *
 * `DropdownMenu` sits at `z-dropdown` and has the same latent problem; it has not
 * bitten because no surface in this system opens one from inside a Popover yet.
 * Do not "fix" this by matching it. See the z-ladder note in
 * `@velobitsio/tokens/theme.css`.
 *
 * ## Highlight styling is `data-[highlighted]`, never `:hover`
 *
 * Identical rule to `DropdownMenu`, for the identical reason: Radix funnels the
 * pointer path and the keyboard path into one thing. On `pointermove` it focuses
 * the item; arrow keys move focus through the collection; both mirror onto
 * `data-highlighted`. Reach for a pointer-only pseudo-class instead and the
 * panel looks perfect with a mouse and is completely invisible to the keyboard:
 * the arrows still work, the attribute still flips, nothing appears to move, and
 * the user has no idea what Enter will activate. If you ever see one on
 * `SelectItem` below, it is a bug, not a preference , and `select.test.tsx`
 * greps this file for it, which is also why the class is never spelled out here
 * (Tailwind v4 scans comments as source, so an example IS a candidate).
 */

/**
 * `sm` exists because this control is used as a toolbar affordance at least as
 * often as it is used as a form field , the `CodeBlock` language switcher and
 * the icon playground's size/motion pickers are all `sm`. Before this variant
 * every one of those call sites hand-patched `h-7 w-auto text-xs` plus a
 * background-position override to move the chevron, and the last of those was a
 * documented footgun (a background utility on `NativeSelect` evicts its chevron
 * data URI through tailwind-merge). A variant is one decision made once.
 */
const selectTriggerVariants = cva(
  [
    'flex w-full items-center justify-between gap-2 rounded-md border border-input bg-panel text-fg control-recessed',
    'whitespace-nowrap',
    'transition-[color,box-shadow] duration-micro ease-out',
    'outline-none focus-visible:ring-[3px] focus-visible:ring-ring/40',
    'disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50',
    'data-[placeholder]:text-muted-foreground',
    'aria-invalid:border-danger aria-invalid:ring-danger/30',
    // The value can be longer than the control; it truncates rather than
    // widening the trigger, and the chevron never moves.
    '[&>span]:min-w-0 [&>span]:truncate',
    // Icons inside an item's value render at the label's size and colour.
    '[&_svg]:pointer-events-none [&_svg]:shrink-0',
  ],
  {
    variants: {
      size: {
        /** Form-field height. Matches `Input`, `Textarea` and `NativeSelect`. */
        default: 'h-9 ps-3 pe-3 text-sm',
        /** Toolbar height. Matches `Button` size `sm` and the `CodeBlock` bar. */
        sm: 'h-7 ps-2 pe-2 text-xs',
      },
    },
    defaultVariants: {
      size: 'default',
    },
  },
);

function Select({ ...props }: React.ComponentProps<typeof SelectPrimitive.Root>) {
  return <SelectPrimitive.Root data-slot="select" {...props} />;
}

function SelectGroup({ ...props }: React.ComponentProps<typeof SelectPrimitive.Group>) {
  return <SelectPrimitive.Group data-slot="select-group" {...props} />;
}

/**
 * Renders the selected item's `SelectItemText`, or `placeholder` when the value
 * is the empty string. Radix mirrors that emptiness onto `data-placeholder` on
 * the TRIGGER, which is where the muted colour is applied , the placeholder text
 * itself is not separately targetable.
 */
function SelectValue({ ...props }: React.ComponentProps<typeof SelectPrimitive.Value>) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

export interface SelectTriggerProps
  extends
    React.ComponentProps<typeof SelectPrimitive.Trigger>,
    VariantProps<typeof selectTriggerVariants> {}

/**
 * The chevron is a real `<svg>` child, not a background-image data URI.
 *
 * That is the one structural difference from `NativeSelect`, and it is a
 * straight upgrade: the data-URI approach exists there only because a native
 * `<select>` must stay a single focusable node, and it costs that component a
 * hard-coded colour per theme, a documented tailwind-merge hazard at every call
 * site that touches `bg-*`, and a Tailwind-scans-comments-as-source hazard in
 * any file that mentions it. A Radix trigger is a `<button>` wrapping children,
 * so the icon can simply be a child that inherits `currentColor` and rotates on
 * open.
 *
 * `aria-hidden` on the icon: Radix already names the trigger from its value and
 * `aria-labelledby`, and an unlabelled decorative glyph inside a `combobox`
 * appends noise to that name.
 */
function SelectTrigger({ className, size, children, ...props }: SelectTriggerProps) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      data-size={size ?? 'default'}
      className={cn('group/select-trigger', selectTriggerVariants({ size }), className)}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon asChild>
        <ChevronDownIcon
          size={16}
          data-slot="select-chevron"
          className={cn(
            'shrink-0 text-muted-foreground',
            'transition-transform duration-micro ease-out',
            /*
             * A NAMED GROUP on the trigger, not `data-[state=open]:` on the icon.
             *
             * `SelectPrimitive.Icon` renders `<span aria-hidden>{children}</span>`
             * and forwards NOTHING else , no `data-state`, no open/closed signal
             * of any kind. A `data-[state=open]:rotate-180` written here compiles
             * to a perfectly valid rule that can never match, so the chevron just
             * silently never turns. The state lives on the trigger; this reads it
             * from there. Same construction as `AccordionTrigger`, and a named
             * group rather than a bare one so a `group` on an ancestor row cannot
             * capture it.
             */
            'group-data-[state=open]/select-trigger:rotate-180',
          )}
        />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

/**
 * `position="popper"` is the default here and changing it is not supported , see
 * condition 1 in the file docblock. `item-aligned` also fights the design: this
 * panel is meant to read as a menu hanging off the trigger, like `DropdownMenu`,
 * not as an OS picker overlaying it.
 *
 * Enter/exit animate `opacity` and `transform` only. Never add a blur-radius
 * transition: `backdrop-filter` re-rasterises the whole backdrop every frame,
 * and a 240ms blur tween on a control that opens on every click is a measurable
 * jank source.
 */
function SelectContent({
  className,
  children,
  position = 'popper',
  sideOffset = 6,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Content>) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Content
        data-slot="select-content"
        position={position}
        sideOffset={sideOffset}
        className={cn(
          'glass z-popover overflow-hidden rounded-lg text-sm text-fg',
          /*
           * `flex flex-col` IS the scroll mechanism, not cosmetics.
           *
           * Radix gives the viewport `flex: 1` and `overflow: hidden auto` as
           * INLINE styles. In a plain block container `flex: 1` means nothing,
           * so the viewport grows to its full content height, the content's
           * `max-h` clips it with `overflow-hidden`, and the tail of a long list
           * becomes unreachable , it does not scroll, it is simply cut off, and
           * the scroll buttons sit below the cut. A flex column bounds the
           * viewport to the leftover space instead. (`min-height: auto` resolves
           * to 0 on it for free, because it has a non-visible `overflow`.)
           */
          'flex flex-col',
          // Radix publishes the space it actually has after collision detection,
          // so a long list scrolls inside itself rather than off-screen.
          'max-h-(--radix-select-content-available-height)',
          /*
           * A floor of the trigger's own width , a panel narrower than the
           * control it hangs off reads as a rendering fault. It is a FLOOR and
           * not a fixed width: a label longer than the trigger widens the panel
           * rather than truncating, which is the behaviour a native `<select>`
           * has and the thing people miss most when they leave it.
           *
           * No `w-full` here. The content is `position: fixed` (popper), so its
           * containing block is the viewport and `w-full` would be 100vw.
           */
          'min-w-(--radix-select-trigger-width) max-w-(--radix-select-content-available-width)',
          // Scale from the edge nearest the trigger, so the panel appears to
          // come out of the control rather than out of the middle of the screen.
          'origin-(--radix-select-content-transform-origin)',
          'duration-enter ease-out',
          'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          'data-[side=bottom]:slide-in-from-top-1 data-[side=top]:slide-in-from-bottom-1',
          'data-[side=left]:slide-in-from-right-1 data-[side=right]:slide-in-from-left-1',
          className,
        )}
        {...props}
      >
        <SelectScrollUpButton />
        {/*
         * No overflow utility here on purpose: the primitive already sets
         * `overflow: hidden auto` and `flex: 1` INLINE, and an inline style
         * outranks any class, so a `overflow-y-auto` here would be a no-op that
         * reads like the thing making scrolling work. What makes it work is
         * `flex flex-col` on the content above.
         */}
        <SelectPrimitive.Viewport data-slot="select-viewport" className="p-1">
          {children}
        </SelectPrimitive.Viewport>
        <SelectScrollDownButton />
      </SelectPrimitive.Content>
    </SelectPrimitive.Portal>
  );
}

/**
 * A section heading inside the panel. Not an item , it has no `option` role and
 * cannot be highlighted or selected. Pair with `SelectGroup` so assistive tech
 * associates the heading with the options it heads.
 */
function SelectLabel({ className, ...props }: React.ComponentProps<typeof SelectPrimitive.Label>) {
  return (
    <SelectPrimitive.Label
      data-slot="select-label"
      className={cn('px-2 py-1.5 text-xs font-medium text-muted-foreground', className)}
      {...props}
    />
  );
}

/**
 * The tick sits in a reserved inline-start gutter (`ps-8` + `start-2`), both
 * LOGICAL properties, so nothing has to be mirrored under `dir="rtl"`. The
 * gutter is reserved on every item, selected or not , allocating it only to the
 * selected row would shift every label sideways as the value changes.
 *
 * `bg-highlight` is `--highlight`, the system's one hover/active surface, so a
 * Select row, a DropdownMenu row and a table row all highlight identically.
 */
function SelectItem({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Item>) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        'relative flex w-full cursor-default items-center gap-2 rounded-sm py-1.5 pe-2 ps-8 outline-none',
        'select-none',
        'data-[highlighted]:bg-highlight data-[highlighted]:text-fg',
        'data-[disabled]:pointer-events-none data-[disabled]:opacity-50',
        '[&>svg]:pointer-events-none [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-muted-foreground',
        'data-[highlighted]:[&>svg]:text-fg',
        className,
      )}
      {...props}
    >
      <span className="pointer-events-none absolute start-2 flex size-4 items-center justify-center">
        <SelectPrimitive.ItemIndicator>
          <CheckIcon size={14} />
        </SelectPrimitive.ItemIndicator>
      </span>
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
    </SelectPrimitive.Item>
  );
}

/**
 * `--border`, not `--field-border`: a separator is decorative and carries no
 * information, so WCAG 1.4.11 does not apply to it. Same call as `Separator`.
 */
function SelectSeparator({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.Separator>) {
  return (
    <SelectPrimitive.Separator
      data-slot="select-separator"
      className={cn('-mx-1 my-1 h-px bg-border', className)}
      {...props}
    />
  );
}

/**
 * Radix renders these only when the viewport actually overflows, so a short list
 * pays nothing for them. They are `aria-hidden` by the primitive , the scroll
 * they trigger is already reachable with the arrow keys.
 */
function SelectScrollUpButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollUpButton>) {
  return (
    <SelectPrimitive.ScrollUpButton
      data-slot="select-scroll-up-button"
      className={cn(
        'flex cursor-default items-center justify-center py-1 text-muted-foreground',
        className,
      )}
      {...props}
    >
      <ChevronUpIcon size={14} />
    </SelectPrimitive.ScrollUpButton>
  );
}

function SelectScrollDownButton({
  className,
  ...props
}: React.ComponentProps<typeof SelectPrimitive.ScrollDownButton>) {
  return (
    <SelectPrimitive.ScrollDownButton
      data-slot="select-scroll-down-button"
      className={cn(
        'flex cursor-default items-center justify-center py-1 text-muted-foreground',
        className,
      )}
      {...props}
    >
      <ChevronDownIcon size={14} />
    </SelectPrimitive.ScrollDownButton>
  );
}

export {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectScrollDownButton,
  SelectScrollUpButton,
  SelectSeparator,
  SelectTrigger,
  SelectValue,
  selectTriggerVariants,
};
