---
'@velobitsio/ui': minor
'@velobitsio/tokens': minor
---

Added `Slider`, and fixed the control material it exposed , two selection
indicators had been generating no CSS at all.

```tsx
import { Slider } from '@velobitsio/ui';

<span id="size-label">Size</span>
<Slider aria-labelledby="size-label" value={[size]} onValueChange={setSize} />;
```

Single or multi-thumb, both orientations, RTL handled by the primitive. Reach for
it when the value is found by **feel** , "somewhere around 20px", "roughly 60%".
If the useful answers are a short list of named values that is a
`SegmentedControl` or a `NativeSelect`; a slider you have to nudge with arrow keys
to hit an exact number is a number input wearing a costume.

**The accessible name goes on the thumb, and the type system now forces it.**
Radix renders `Slider.Root` as a plain `<span>` and puts `role="slider"`,
`tabindex` and the `aria-value*` attributes on each **Thumb**. So `htmlFor`
pointing at the root associates with nothing , a `<span>` is not a labelable
element, no name is computed, and nothing warns , while `aria-label` on the root
is actively worse: it names an element with no role while the thing AT focuses
stays anonymous. A name is required at the type level in one of the two spellings
that work, and is forwarded onto the thumbs. Two thumbs take two names via
`thumbLabels`, because one shared name announces both handles identically and a
screen-reader user cannot tell which end they are holding. The test asserts the
name resolves on the element with `role="slider"`, not merely that the attribute
exists somewhere in the tree.

`formatValue` writes `aria-valuetext`, which replaces the bare number in the
announcement, so "24" can be "24 pixels" on every step rather than only in a
visible label heard once on focus.

The 24×24 pointer target of WCAG 2.2 §2.5.8 is a pseudo-element, not a bigger
thumb: the visible thumb stays 16px on the 6px track and the target is invisible
around it.

## The bug `Slider` surfaced, which had already shipped twice

`control-raised` and `control-material` were plain classes in a `components`-layer
import. That made this generate **nothing**:

```
data-[state=on]:control-raised      ← not an error, not a warning, no rule
```

A Tailwind variant can only compose over a utility Tailwind itself owns. Over
hand-written CSS it is an unknown class: it sits in the DOM looking correct while
`getComputedStyle` returns `box-shadow: none`. Two call sites had it, both with
the same symptom , a selected thing that did not look selected:

- `SegmentedControl`, whose active segment measured **1.00:1** against its own
  track in dark mode, where `--bg2` **is** `--panel`
- `Tabs`, the active pill of `variant="default"`

`theme.css` already documented this exact failure one layer over, for the `z-*`
scale. Both are now `@utility` rules, and both call sites gain a
`--field-border` edge so the indicator does not rest on a fill alone , that step
is the one documented as clearing 3:1 against both themes' surfaces (3.58:1 dark,
3.86:1 / 3.27:1 light).

⚠️ **`controls.css` must stay a top-level import.** Wrapping it back in
`layer(components)` puts `@utility` inside a layer, where it is inert, and every
symptom above returns silently. The old layering existed so a call site's
`shadow-*` could override the material without `!important`; that job now belongs
to `cn`, which declares `control-material` and `shadow` as conflicting groups in
both directions so exactly one box-shadow class survives. `primitives.test.tsx`
pins it.
