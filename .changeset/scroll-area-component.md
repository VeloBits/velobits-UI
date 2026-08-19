---
'@velobitsio/ui': minor
---

Added `ScrollArea`, a scrollable region with a scrollbar the system controls.

```tsx
import { ScrollArea, ScrollBar } from '@velobitsio/ui';

<ScrollArea className="h-56">{/* bounded height required */}</ScrollArea>;
```

`ScrollArea` renders its own vertical bar. Pass `ScrollBar` explicitly only for
the horizontal axis.

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

One thing to know before using it. Radix moves the overflow onto an inner
viewport, so the Root needs a bounded height from a class, a grid track or a flex
parent. Given none it grows to fit its content and never scrolls, which reads as
the component being broken rather than unconstrained.
