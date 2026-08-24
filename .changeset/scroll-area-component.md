---
'@velobitsio/ui': minor
---

Added `ScrollArea`, a scrollable region with a scrollbar the system controls.

```tsx
import { ScrollArea } from '@velobitsio/ui';

<ScrollArea className="h-56">{/* bounded height required */}</ScrollArea>;
<ScrollArea axis="x">{/* or "y", the default, or "both" */}</ScrollArea>;
```

Pick axes with `axis`, and not by passing `ScrollBar` as a child. Children render
inside the viewport, so a bar passed that way ends up in the scrolling content and
slides away with what it is measuring. `axis` also decides which axes scroll at
all, since Radix enables the viewport overflow per axis from whether a bar for it
is mounted.

**The thumb is `--field-border`, not `--border`.** That is the same distinction
`Separator` documents from the other side, and it is why the palette carries two
line tokens. A separator divides nothing a reader must perceive, so WCAG 1.4.11
does not apply and it is free to recede. A scrollbar reports position and accepts
a drag, so it is an interactive control and has to clear 3:1 against whatever it
sits on. `--field-border` is asserted to exactly that, in both themes from a
single value, against both `--bg` and `--panel`, so one thumb colour is correct on
the page and inside a panel without a variant.

The track is transparent on purpose: it would be the widest block of flat colour
on a long page, and filling it is most of what makes a custom scrollbar look
dated.

Two things to know before using it.

It is for a box that ALWAYS overflows. Radix sets the viewport to
`overflow: scroll` as soon as a scrollbar mounts, not `overflow: auto`, and not
gated on whether the content overflows. `type="auto"` governs when the bar is
visible, not that. So a region whose content fits becomes a scroll container
with nothing to scroll: the wheel is captured, the page does not move, and it
lurches once the chain reaches the document. For content whose length depends
on the page, plain `overflow-y-auto` is the better tool, and this repo's own
docs chrome uses it for that reason.

And: Radix moves the overflow onto an inner
viewport, so the Root needs a bounded height from a class, a grid track or a flex
parent. Given none it grows to fit its content and never scrolls, which reads as
the component being broken rather than unconstrained.

**The component positions its own thumb, and that is not a stylistic choice.**
Radix moves the thumb from a `requestAnimationFrame` loop wrapped in an IIFE
carrying esbuild's `@__PURE__` annotation. SWC binds that annotation to the outer
call, finds the result unused, and deletes the invocation, so every minified build
ships `addUnlinkedScrollListener` as two dead property reads. The thumb then moves
once per gesture, roughly 100ms after you stop, and does not follow your pointer
when you drag it. `ScrollArea` drives the transform from a `passive` `scroll`
listener instead, which is correct minified or not and needs nothing from your
build config.

Worth knowing if you use `@radix-ui/react-scroll-area` **directly** anywhere else
in your app: those instances still have it. The same deletion also takes out
typeahead's `updateSearch` in `react-menu` and `react-select`, so multi-character
typeahead in a Radix menu or select stops accumulating and each keystroke searches
from scratch. Nothing in this package can fix those for you; upstream has to.

**A region that runs out of room does not hand the rest of the gesture to the
page.** Reach the end of a bounded scroll region and the browser's default is to
chain the remaining scroll to its ancestor, so the page lurches. It bites hardest
on a short region, because the range decides how fast you get there — a 274px
region is three notches of a typical mouse wheel. `ScrollArea` sets
`overscroll-behavior: contain` on the axis that scrolls, and the scrollbar itself
swallows the wheel, since a bar is a _sibling_ of the viewport and no CSS on the
viewport can reach its scroll chain.

Two deliberate limits. It applies **only while the region actually overflows** —
Radix makes the viewport `overflow: scroll` unconditionally, so a region whose
content fits is a scroll container with nothing to scroll, and containing that
would leave the page unscrollable from that spot. And it contains **only the
scrolling axis**, so a vertical `ScrollArea` still chains a horizontal gesture and
keeps the browser's back-swipe.

Not fixed, because nothing can: Chrome latches a wheel gesture to whatever it
started on. Start scrolling the page, move the pointer over a region mid-gesture,
and the page keeps going by design until the gesture ends.
