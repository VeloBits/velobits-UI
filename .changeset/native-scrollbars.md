---
'@velobitsio/tokens': minor
'@velobitsio/ui': patch
---

Native scrollbars are now part of the design system, not the platform.

The token import restyles **every** scroller in a consuming app, not just the
ones wrapped in a `ScrollArea`: the document, an `overflow-y-auto` sidebar, a
long line inside a `CodeBlock`. Previously those were whatever the OS drew , on
Linux and Windows Chrome a 15px gutter with a flat filled track and two arrow
buttons, sitting immediately beside a design system that had measured everything
else on the page.

**The look is `ScrollArea`'s look, deliberately.** A 10px gutter (`w-2.5`, copied
from `scroll-area.tsx` rather than re-chosen), a transparent track, no arrow
buttons, and a pill thumb painted `--field-border` inset 2px so it floats rather
than fills. A page that mixes a native scroller with a `ScrollArea` , the docs
site does , now shows one bar, not two. It also erases the platform difference:
the same page looks the same on macOS, Windows and Linux.

Hover and drag darken the thumb in light mode and lighten it in dark, from one
`color-mix` toward `--fg`, and shed 1px of inset so the pill grows 6px → 8px
inside a gutter whose width never changes. Measured: 3.32 → 5.64 → 8.48:1 on the
light page, 4.67 → 7.83 → 11.19:1 on the dark one.

New: `packages/tokens/css/scrollbar.css`, exported as
`@velobitsio/tokens/scrollbar.css` and imported by `theme.css`, so existing
consumers get it with no change. Six inherited variables tune it per scroller
(`--scrollbar-size`, `--scrollbar-inset`, `--scrollbar-track`,
`--scrollbar-thumb`, `--scrollbar-thumb-hover`, `--scrollbar-thumb-active`), plus
two utilities:

- **`scrollbar-none`** hides the bar without removing the scroller, for a
  horizontally scrolled strip whose affordance is the content running off the
  edge. The region still needs `tabIndex={0}`.
- **`scrollbar-on-dark`** for a surface that is dark in _both_ themes.

`CodeBlock variant="terminal"` now carries `scrollbar-on-dark`, which is a fix
rather than a decoration. Its root is `overflow-auto` and `--code` is `#101828`
in both themes, so the default escalation , which mixes toward `--fg` , runs
backwards there in light mode: rest 4.58:1, hover **2.69:1**, drag **1.79:1**.
The bar faded into the block exactly as you reached for it. The utility
re-anchors hover and drag to the neutral ramp (9.99:1 and 15.05:1) and leaves
rest alone, since `--neutral-500` already _is_ `--field-border`.

**⚠️ Do not set `scrollbar-width` or `scrollbar-color` at a call site.** Chrome
121+ supports both, and setting either one on a scroller makes it discard every
`::-webkit-scrollbar-*` rule for that element , not merge, not lose on the
cascade, ignore , handing back the platform bar with its arrow buttons. Nothing
warns, and the rules still sit in DevTools looking applied. The token layer
confines both properties to a Firefox-only
`@supports not selector(::-webkit-scrollbar)` gate for this reason, and
`scrollbar-css.test.ts` fails the build if either escapes it.

Also found while measuring, and **not** changed here: `--field-border` on
`--bg2` is 2.91:1 in light mode, just under the 3:1 WCAG 1.4.11 asks of a thumb.
`contrast-pairs.ts` gates `fieldBorder` against the page and the panel but not
against `--bg2`, so it is unmeasured rather than accepted. It applies identically
to `ScrollArea` and to every `Input` border on a `bg-bg2` surface, which makes it
a palette decision rather than a scrollbar one.
