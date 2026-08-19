'use client';

import { ScrollArea as ScrollAreaPrimitive } from 'radix-ui';

import { cn } from '../lib/cn';

/**
 * A scrollable region with a scrollbar we control the look of.
 *
 * ## Why the thumb is `bg-field-border` and not `bg-border`
 *
 * The palette carries two line tokens and the split is a WCAG one, the same
 * distinction `Separator` documents from the other side. A separator divides
 * nothing a reader must perceive, so 1.4.11 does not apply and it recedes on
 * `--border`. A scrollbar is the opposite case: it is an interactive control that
 * reports position and accepts a drag, so it has to clear 3:1 against whatever it
 * sits on.
 *
 * `--field-border` is the token that does, and it is asserted to in both themes
 * from a SINGLE value, against both `--bg` and `--panel`
 * (`packages/tokens/test/contrast.test.ts`). So one thumb colour is correct on the
 * page and inside a panel, in light and dark, without a variant.
 *
 * The track stays transparent. It is decoration, it would be the widest block of
 * flat colour on any long page, and giving it a fill is what makes a custom
 * scrollbar read as a browser from 2009.
 *
 * ## The native scrollbar is not merely hidden
 *
 * Radix moves the overflow onto an inner viewport, so `className` on the Root is
 * layout for the BOX and the scrolling happens a level in. Two consequences worth
 * knowing before reaching for this:
 *
 *   - The Root needs a bounded height from somewhere (`h-*`, a grid track, a
 *     flex parent). Given none it grows to fit its content and never scrolls,
 *     which looks like the component silently not working.
 *   - `overflow-y-auto` on the same element is redundant at best. Use one or the
 *     other.
 *
 * Keyboard scrolling, wheel, touch and the scroll-anchoring browsers do are all
 * preserved, because the viewport is a real scroll container. What is lost is the
 * OS scrollbar's own affordances, which is the trade being made deliberately.
 */
function ScrollArea({
  className,
  children,
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Root>) {
  return (
    <ScrollAreaPrimitive.Root
      data-slot="scroll-area"
      className={cn('relative', className)}
      {...props}
    >
      <ScrollAreaPrimitive.Viewport
        data-slot="scroll-area-viewport"
        /*
         * `focus-visible` on the viewport, not the Root: the viewport is what
         * takes focus when the region is keyboard-scrollable, and a ring drawn on
         * the Root would sit outside the clip and half-overlap the scrollbar.
         */
        className="size-full rounded-[inherit] outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      >
        {children}
      </ScrollAreaPrimitive.Viewport>
      <ScrollBar />
      <ScrollAreaPrimitive.Corner />
    </ScrollAreaPrimitive.Root>
  );
}

/**
 * Rendered by `ScrollArea` already. Export exists for the two-axis case, where a
 * second one is passed with `orientation="horizontal"`.
 */
function ScrollBar({
  className,
  orientation = 'vertical',
  ...props
}: React.ComponentProps<typeof ScrollAreaPrimitive.Scrollbar>) {
  return (
    <ScrollAreaPrimitive.Scrollbar
      data-slot="scroll-area-scrollbar"
      orientation={orientation}
      className={cn(
        'flex touch-none select-none transition-colors duration-micro ease-out',
        orientation === 'vertical' && 'h-full w-2.5 border-s border-s-transparent p-px',
        orientation === 'horizontal' && 'h-2.5 flex-col border-t border-t-transparent p-px',
        className,
      )}
      {...props}
    >
      <ScrollAreaPrimitive.Thumb
        data-slot="scroll-area-thumb"
        className="relative flex-1 rounded-pill bg-field-border"
      />
    </ScrollAreaPrimitive.Scrollbar>
  );
}

export { ScrollArea, ScrollBar };
