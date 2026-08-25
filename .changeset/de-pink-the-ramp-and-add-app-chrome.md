---
'@velobitsio/tokens': minor
'@velobitsio/ui': minor
---

Re-palette: the neutral ramp is de-pinked, the light page seed is renamed, and
app chrome becomes its own tier.

**Every neutral value in the system changes.** Expect to re-look at any surface
you painted, even though no token was removed and nothing renamed in the CSS.

**The ramp held the wrong hue, and then did not hold it.** It sat at 44.9° with
chroma up to 0.0086. That is pink-orange, not warm: at L 0.9447 it put R ten
8-bit steps above B with G below the R..B midpoint, which is a magenta cast on
the largest surface in the product. Worse, the hue **drifted** down the column,
44.9° at the light end to 145.5° at the dark end, so `--muted-fg` was a
green-grey sitting on a pink page , two near-complementary low-chroma colours,
which is not a neutral ramp. The column is now flat at **74°** with the chroma
roughly halved, and all the decay lives in the chroma column where it belongs.

The old per-row hue drift was defended on the grounds that at chroma this low the
8-bit grid is coarser than the hue step, so the measured hue is a quantisation
artefact. That much was true and is still recorded per row. It did not cover the
**R−B spread**, which is not an artefact and is what the eye reads.

**`seed.cream` → `seed.paper`, `#F4EDEA` → `#EFEDEA`.** The rename is the point:
the value carries the same warmth on the yellow side of orange at half the
chroma, so R−B falls from 10 to 5 and the page reads as paper rather than dusty
beige. L moves 0.951 → 0.947, under one 8-bit step of luminance, so no contrast
pair moves meaningfully.

⚠️ **That rename is a breaking export**, and the only one here. `seed` is public
from `@velobitsio/tokens`, so `seed.cream` is now `undefined` , TypeScript catches
it, but anything reading the seed through an index or a spread does not, and a
`undefined` background is a transparent one rather than an error. Search for
`cream` before upgrading. Nothing else was renamed: every CSS custom property and
every Tailwind utility keeps its name and only its value moves.

One number in the documentation moves with it, and it is worth knowing which:
`--primary` measures **3.86:1** on the page, not the 3.90:1 quoted since launch.
The blue did not change , the page under it did. The conclusion is untouched:
`--primary` is a fill, links use `--primary-text`.

**The light glass tier was passing its gate on the pink cast, and this is the
part that would have broken silently.** Tier S has to clear the perceptibility
floor from both the page below it and the opaque `--panel` above it. The
perceptibility check takes the **max over channels**, so the old light pair
scraped the 8/255 floor on the **blue channel alone** , the cast, not the
lightness. De-pinking removes exactly that, so the tier had to be re-tuned rather
than merely re-generated. The stops now clear **9–12/255 on luminance** against
both, which is separation the eye can actually use, and the gate now measures a
figure that means what it says.

**New: the `chrome` tier, seven tokens.** `--chrome`, `--chrome-fg`,
`--chrome-muted-fg`, `--chrome-border`, `--chrome-highlight`, `--chrome-accent`
and `--chrome-accent-soft`, with Tailwind utilities for each.

```tsx
<header className="bg-chrome text-chrome-fg">
  <a className="text-chrome-muted-fg hover:bg-chrome-highlight">Docs</a>
  <a className="text-chrome-accent">Components</a>
</header>
```

It is **plum in both themes** and does not flip, which is the whole reason it
needs its own foregrounds: none of the theme's own apply to it. Charcoal `--fg`
on `--chrome` is **1.23:1**, `--muted-fg` 1.84:1 and `--primary-text` 1.87:1, so
reaching for the familiar token here produces text nobody can read in light mode.
Both themes are gated even though the tier is theme-invariant , that is what
catches someone giving dark mode its own chrome value later and forgetting the
foregrounds.

The dark values are **restated rather than inherited**, the same discipline
`code`/`on-code` already follow, so editing one half cannot silently change the
other.

`--warning` and `--info` were re-tuned against the new page, and `AppShell` moves
onto the chrome tokens.
