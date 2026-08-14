# @velobitsio/tokens

## 0.2.0

### Minor Changes

- b3a583a: Glass material, page texture, and a wider tonal vocabulary.

  **Two accessibility bugs fixed, both of which shipped and neither of which any
  existing gate could catch.**

  - `--info` was byte-identical to `--primary-text` (`#0062B3` light, `#4AACFF`
    dark), so an info chip and a hyperlink were the same colour. `info` is now
    **teal**, tuned to clear AA inside its own soft chip (5.08:1 light, 4.94:1
    dark). A new `DISTINCT_ROLE_PAIRS` gate measures OKLab ΔE between roles that
    must be tellable apart — the class of bug where every token is individually
    legible and two of them are the same colour.
  - `Button variant="destructive"` painted white on `--danger`, which in dark mode
    measures **2.45:1**. `--danger` has to be a light red there because the same
    token also serves as text on a dark surface, and the fill-with-text-on-it
    combination had no contrast pair at all. New `--on-danger` (white in light,
    charcoal in dark, mirroring `--on-brand` on lime) and a pair to gate it.

  **Glass.** Tier S now paints a two-stop directional sheen instead of a flat fill.
  Both stops are separate tokens, composited and gated individually — a gradient
  baked into one value would have been opaque to the perceptibility gate, and the
  stop it would have hidden is the far one, which sits on the 8/255 floor in light
  mode. Separation is 5/255 light and 4/255 dark, which is the entire legal budget.

  **Page texture** — new, opt-in `.page-texture`: a scrolling dot grid plus a fixed
  plum-tinted bloom. This is what makes the blur tier mean anything; blurring a
  uniform page returns that same uniform page, so every `backdrop-filter` in the
  system was a per-frame backdrop snapshot producing an identical picture. It
  supersedes Locked Decision 5 deliberately, with sign-off. The texture **may only
  darken** — asserted per channel per layer — which is why it needed no re-tuning
  anywhere else: a glass surface is lighter than its page in both themes, so
  darkening only widens the gap the gate measures (light 11→20 / 8→17, dark 12→25 /
  9→22).

  The depth ceiling is **per theme**, because the two themes are bounded by entirely
  different things. Light is pinned at its WCAG ceiling: `--muted-fg` on the stacked
  worst case measures 4.60:1, and 1.5× those alphas fails AA. Dark has no
  accessibility ceiling at all — darkening a near-black page _raises_ text contrast,
  so `--muted-fg` climbs to 8.04:1 as the texture deepens and pure black would still
  pass every gate. Dark therefore runs at twice light's depth, and its ceiling is the
  only guard against the charcoal page quietly becoming black.

  **The control material** — new `.control-raised` / `.control-recessed`, and the
  answer to "the components still don't look like glass".

  They didn't, and it wasn't the surfaces' fault. Every control in the system was a
  **flat fill** — `Button`, `Input`, `Textarea`, `NativeSelect`, `Checkbox`, the
  `Switch` thumb, `Kbd`, the `TabsList` and `SegmentedControl` tracks,
  `AvatarFallback`, `CodeBlock`. So a Card read as glass and everything inside it
  read as paper.

  It also fixes a measured bug: a `--panel` control on a `--panel` surface is
  **0/255 in both themes** — an `Input` inside a `Panel` is exactly its backdrop's
  colour, identified by its 1px border alone. A lit edge and an inset well give a
  control an identity that does not depend on its fill differing from what it sits
  on, which is the only fix available, since `--panel` is what both legitimately
  want to be.

  Deliberately edge, light and depth — **not** more translucency, and that is
  measured rather than assumed. A tier-S surface transmits 15% of its backdrop at
  α 0.85, so the page texture arrives inside a Card at ~2/255, below perception;
  lowering the alpha to let it through breaks the perceptibility gate before it
  becomes visible (in light mode _nothing_ below 0.85 passes). The gate that makes a
  surface read as raised and the transparency that would make it read as see-through
  are in direct opposition. Edges cost nothing from that budget.

  Same asymmetry as the glass tier, for the same reason: light's `--panel` is
  `#FFFFFF` and a white lit edge over it measures **1.00:1 at every alpha**, so
  light's `--control-lit` is `transparent` and its raised material is the shadow.
  Dark's lit edge reads at 1.56:1 and is the material — at α 0.14, a fraction of
  tier S's 0.50, because on a 36px control that value is a bright white line.

  `--control-shadow` exists as its own token rather than reusing `--shadow-sm`
  because `--shadow-sm` is `none` in dark mode, and `none` inside a comma-separated
  `box-shadow` list invalidates the whole declaration — which would silently delete
  dark mode's lit edge. Same trap as `--glass-surface-shadow`. `cn` also gained a
  `control-material` class group: both classes set `box-shadow` and are component
  classes rather than prefixed utilities, so tailwind-merge kept both and let
  `controls.css` declaration order pick the winner.

  **New tokens.** `--rose` / `--rose-soft` (a category colour that asserts no
  severity — every other chromatic token means a status or the brand, so
  categorical axes had to borrow `primary` and came out blue), `--on-danger`,
  `--brand-hover`, `--danger-hover`, the two sheen stops, the three texture tokens
  and the three control-material tokens.

  **Components.** `Badge` gains `rose`. `Button` uses hover _tokens_ instead of
  `hover:brightness-95` (a filter is outside the palette: unmeasured, and it
  composites differently over glass than over an opaque panel) and gains a
  GPU-composited press that is fully suppressed under reduced motion. `DataTable`
  gains the `surface` passthrough it never had — the component most likely to be
  dropped inside a Card was the only one that could not opt out of nested glass.

  **New:** `@velobits-dev/ui/motion` — `PageTransition`, `Stagger`, `StaggerItem`,
  `FadeIn`. Subpath-only, like `form`: the barrel's own-code budget has ~4 kB left
  and nobody importing a Button should pay for Framer's runtime. `framer-motion`
  was already a required peer and until now bought exactly one `MotionConfig`.
  `Stagger` caps its cascade at 12 items so a 200-row list does not take eight
  seconds to arrive.

  **Release plumbing.** Internal peer ranges widened from `^0.1.0` to `>=0.1.0` on
  `@velobits-dev/{tokens,icons}`, and changesets is now configured with
  `onlyUpdatePeerDependentsWhenOutOfRange`. Together these stop `ui` being forced to
  a spurious **1.0.0** on every `tokens` minor: changesets bumps a peer dependent to
  major unconditionally by default, and the caret range put it out of range as well.
  `>=` also matches how every other peer in that file is already spelled. Verified
  by running `changeset version` — `tokens` 0.2.0, `ui` 0.2.0, `icons` untouched.

  **Breaking, for anyone reading the CSS variable directly:**
  `--glass-surface-bg` is replaced by `--glass-surface-bg-top` and
  `--glass-surface-bg-bottom`. The public API is the `.glass-surface` class, which
  is unchanged.

## 0.1.0

Initial release.

The VeloBits brand palette as CSS custom properties and as TypeScript, built on
a generated warm neutral ramp. Zero dependencies and zero React, so the shared
Keycloak login theme can consume it.

- **Four CSS entry points** — `theme.css` (everything, wired), `tokens.css` (the
  raw properties), `glass.css` (the material alone) and `keycloakify.css` (the
  login-theme bridge).
- **Contrast is a gate, not a guideline.** Every semantic colour pair is
  asserted in both themes. That extends to the composited cases: the five
  text-on-soft-wash chip pairings are measured over the page, over a panel and
  over the glass-surface composite — 30 assertions in all — because a chip is
  never seen against the colour it is declared with.
- **A two-tier glass material.** `.glass` for overlays and `.glass-surface` for
  component surfaces, the latter carrying no `backdrop-filter` by default so a
  grid of cards does not mount a blur layer per card. Both tiers are held to a
  perceptibility floor by a mutation-verified test.
- **Glass material tuned for edge, light and elevation** rather than tint. A
  Tier-S composite is boxed in between the page and the panel, so the separation
  comes from a stronger border, a brighter specular highlight and a real shadow.
  The dark page sits at `neutral-925` `#151615` to open the window that made
  this possible.
- **A theme-invariant `--code` / `--on-code` pair** (12.95:1) for terminal and
  secret-reveal surfaces. Deliberately identical in both themes: a revealed
  secret has to be transcribable exactly, and a surface that flips changes which
  characters are easy to misread.
- CSS↔TS parity, the neutral ramp and the colour maths are all covered by tests.

### Known

`@velobits-dev/ui` declares this package as a peer at `^0.1.0`. On a `0.x`
version a caret pins the **minor**, so a future `0.2.0` here will force a major
bump of `ui` unless that range is widened first.
