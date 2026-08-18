---
'@velobitsio/icons': minor
---

Added 113 icons, taking the set from 88 to 201.

They come from the two sources in the FixMyText frontend that had never been
folded in: 104 editor tool glyphs, keyed by tool id and previously reachable only
through a lookup map, and 9 from the pricing pages. All 104 tool glyphs are
distinct; none collided with an existing name, so nothing was renamed and no
consumer import changes.

The design-system set in that repo needed nothing: its 55 icons were already
here in full, which the diff confirms rather than assumes.

Two were deliberately left out, because they cannot honour the package's
contract:

- `NumIcon` is parameterised (it renders a caller-supplied number), so it is not
  a glyph and `createIcon` cannot express it.
- `TwoIcon` hardcodes `#007ACC` and draws with `<text>`, so it neither inherits
  `currentColor` nor survives a font change.

Both belong with the pricing pages that own their styling.

`fill="currentColor" stroke="none"` on a dot is kept where the source used it:
that is how a filled dot is drawn in a stroke set, and it still inherits colour.

Tree-shaking is unchanged, and asserted rather than claimed: one icon still
imports at 234 B against a 400 B budget. The whole-set budget moves from 6 kB to
9 kB because the set is 2.3x larger; it measures 7.31 kB, so the ceiling keeps
real headroom instead of being fitted to the current number.
