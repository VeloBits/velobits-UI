---
'@velobitsio/tokens': minor
'@velobitsio/ui': minor
---

App chrome is black in dark mode, and the sidebar trigger stops using theme
tokens on a bar that does not follow the theme.

**`--chrome` is no longer theme-invariant.** It stays plum `#592941` in light and
becomes `#000000` in dark. The six foregrounds beside it , `--chrome-fg`,
`--chrome-muted-fg`, `--chrome-border`, `--chrome-highlight`, `--chrome-accent`
and `--chrome-accent-soft` , are unchanged and still identical in both themes, so
no call site needs a `dark:` variant it did not need before. Every contrast pair
in the tier improves in dark mode, because the foregrounds held still and the
surface got darker.

Plum was chosen against a _light_ page, where a dark bar is what separates chrome
from content. There is no light page to frame in dark mode: the bar sits on
`#161615`, and a plum strip there is the only chromatic mass on the screen , it
reads as a component someone coloured rather than as the frame around the app.

⚠️ **If you were overriding this with `dark:bg-black`, delete the override.** The
docs site header carried exactly that patch and it is gone; keeping it is now a
no-op that will hide the next token change from you. More generally, a `dark:`
variant on `bg-chrome` means the token is wrong, not your header.

`#000000` is deliberately **off** the 74° neutral ramp. `neutral-950` (`#0F0F0E`)
is the obvious on-ramp pick and sits **7/255** from the dark page , a bar found
only by its border. At the lightness in question the hue is imperceptible, so the
warmth argument that governs the glass tiers does not reach this token.

**`AppShellSidebarTrigger` now repaints itself for a chrome bar.** It is a
`Button variant="ghost"` underneath, i.e. `text-fg hover:bg-highlight` , both
**theme** tokens, on the one surface that does not follow the theme. It reads the
surface off `AppShellHeader` through context and swaps in the `chrome*`
foregrounds when it is on one; under `surface="glass"` or `"panel"`, or outside a
header, plain `ghost` is still what you get. `AppShellHeader` also publishes
`data-surface` for styling and tests.

⚠️ **This class of bug is invisible in dark mode, which is why it shipped.**
`--fg` is `neutral-100` in dark, so any control styled with theme tokens looks
finished on the dark bar and measures **1.23:1** on the light one. If you have put
your own controls in an `AppShellHeader`, they need the same treatment , there is
no `chrome` Button variant on purpose, because chrome is a property of the
container a control sits in, not of the control:

```tsx
<Button
  variant="ghost"
  size="icon"
  className="text-chrome-fg hover:bg-chrome-highlight hover:text-chrome-fg"
/>
```
