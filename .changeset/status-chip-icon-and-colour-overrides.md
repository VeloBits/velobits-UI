---
'@velobitsio/ui': minor
---

`StatusChip` opens its two visual channels: `icon` replaces the glyph, `variant`
replaces the colour. `status` stays required and stays closed.

```tsx
// A staging rollout that should not read as production-green.
<StatusChip status="on" icon={<CalendarIcon />} variant="info">
  On · staging
</StatusChip>
```

The five statuses cover a control plane's own vocabulary and nothing else. A
consuming product with a house glyph for the same idea, a provider-specific
state, a spinner for one still resolving, or an environment axis the palette was
never asked to carry all had exactly one option: stop using the component and
hand-roll the chip — which is the wash/text pairing being re-derived by hand,
the thing this component exists to prevent.

**The colour override is `variant`, not a colour, and that is the whole design.**
Every value it reaches is a pairing the soft-chip suite in `@velobitsio/tokens`
has already measured at 4.5:1, flattened over the page, the panel and the tier-S
glass surface, in both themes. A `color` prop taking a hex or a CSS variable
would let a caller invent a pair nothing gates, on the one component whose entire
argument is that the pair _is_ gated — and it would fail silently, because a chip
that is merely hard to read still looks like it works.

`icon` takes an **element** (`icon={<ZapIcon />}`), the same shape as
`EmptyState` and every other icon slot in the system, so a non-icon glyph fits
the same slot. It renders inside an `aria-hidden` wrapper rather than trusting
what is passed to carry the attribute itself: `createIcon` sets it, an arbitrary
`<svg>` or `<img>` does not, and a glyph that announces the state a second time
is invisible on screen and audible only to the readers this component was written
for. Same reasoning and same shape as `EmptyState`.

**Fixed on the way past: the glyph has never rendered at the size it claims.**
The component passed `size={11}` internally from the day it was written, and
every chip rendered at 12. `size` emits `width`/`height` presentation attributes;
`Badge` sets `[&_svg:not([class*='size-'])]:size-3`; an SVG presentation
attribute loses the cascade to any author rule, so the class won every time.
Nothing caught it because happy-dom applies no Tailwind, which left the attribute
as the only observable and it read 11. The size is now a class on the chip, which
`cn`'s twMerge collapses against Badge's — deterministically, rather than leaving
the winner to stylesheet order — and the regression test asserts the merge rather
than the attribute. Glyphs are 1px smaller than they were.

This is the same trap in the documented escape hatch: **size an overriding glyph
with `className="size-4"`, never with `size={16}`.** `EmptyState`'s doc comment
still claims `<FlagIcon size={40} />` gets 40; it gets 24, for this reason.

Additive — no call site changes. What the component cannot check is a _set_: it
only ever sees one chip, so keeping two states distinguishable in silhouette
after an override stays the caller's job, and `status` still drives `data-status`
and `STATUS_ORDER` so a dressed-up chip sorts and groups as the state it is.
