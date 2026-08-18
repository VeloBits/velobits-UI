# Release 0.1.0 → 0.2.0

Reference document, reconstructed from the git delta between the `@velobits/*@0.1.0`
tags and `origin/main`. **This is not a changeset** , the changeset that produced 0.2.0
was `.changeset/glass-material-and-tonal-expansion.md`, added in `b3a583a` and consumed
by `changeset version` in `f2bc22a`. Do not move this file into `.changeset/`; that would
bump every package a second time.

## What ships

| Package              | 0.1.0 | 0.2.0     | Bump  | Publishes?                                         |
| -------------------- | ----- | --------- | ----- | -------------------------------------------------- |
| `@velobitsio/tokens` | 0.1.0 | **0.2.0** | minor | yes                                                |
| `@velobitsio/ui`     | 0.1.0 | **0.2.0** | minor | yes                                                |
| `@velobitsio/icons`  | 0.1.0 | 0.1.0     | none  | no , zero diff since its tag                       |
| `@velobitsio/docs`   | ,     | ,         | ,     | no , `private: true`, and in `.changeset` `ignore` |

`ui` lands on **0.2.0, not 1.0.0**. Changesets bumps a peer dependent to major
unconditionally by default, and `^0.1.0` pinned the minor on a 0.x version, so a `tokens`
minor put it out of range as well. Widening the sibling peers to `>=0.1.0` plus
`onlyUpdatePeerDependentsWhenOutOfRange` in `.changeset/config.json` is what avoids the
spurious major.

On publish this produces two tags , `@velobitsio/tokens@0.2.0` and
`@velobitsio/ui@0.2.0` , two GitHub Releases whose bodies are the `## 0.2.0` section of
each package's `CHANGELOG.md`, and two npm publishes at `access: public`. `icons` gets
none of the three.

## Headline: two accessibility bugs that shipped in 0.1.0

Neither was catchable by any gate that existed at 0.1.0.

**`--info` was byte-identical to `--primary-text`** , `#0062B3` light, `#4AACFF` dark , so
an info chip and a hyperlink rendered the same colour. Every token was individually
legible; two of them were simply the same. `info` is now teal (`#256262` light, `#6FBAB9`
dark), tuned to clear AA inside its own soft chip: 5.08:1 light, 4.94:1 dark. The new
`DISTINCT_ROLE_PAIRS` gate measures OKLab ΔE between roles that must be tellable apart,
which is the gate class that was missing.

**`Button variant="destructive"` measured 2.45:1 in dark mode.** It painted white on
`--danger`, and `--danger` has to be a light red in dark because the same token also
serves as text on a dark surface , the fill-with-text-on-it combination had no contrast
pair at all. Fixed by `--on-danger` (`#FFFFFF` light, `#2A2B2A` dark, mirroring `--on-brand`
on lime) plus a pair to gate it.

## Glass

Tier S paints a two-stop directional sheen instead of a flat fill. Both stops are separate
tokens, composited and gated individually , a gradient baked into one value would have been
opaque to the perceptibility gate, and the stop it would have hidden is the far one, which
sits on the 8/255 floor in light mode. Separation is 5/255 light and 4/255 dark: the entire
legal budget.

## Page texture

New opt-in `.page-texture` , a scrolling dot grid plus a fixed plum-tinted bloom. This is
what makes the blur tier mean anything: blurring a uniform page returns that same uniform
page, so every `backdrop-filter` in the system was a per-frame backdrop snapshot producing
an identical picture. Supersedes Locked Decision 5 deliberately, with sign-off.

The texture **may only darken**, asserted per channel per layer. That constraint is why
nothing else needed re-tuning , a glass surface is lighter than its page in both themes, so
darkening only widens the gap the gate measures (light 11→20 / 8→17, dark 12→25 / 9→22).

The depth ceiling is **per theme**, because the themes are bounded by different things.
Light is pinned at its WCAG ceiling: `--muted-fg` on the stacked worst case measures 4.60:1,
and 1.5× those alphas fails AA. Dark has no accessibility ceiling at all , darkening a
near-black page _raises_ text contrast, so `--muted-fg` climbs to 8.04:1 as the texture
deepens, and pure black would still pass every gate. Dark runs at twice light's depth, and
its ceiling is the only guard against the charcoal page quietly becoming black.

## Control material

New `.control-raised` / `.control-recessed` , the answer to "the components still don't look
like glass". They didn't, and it wasn't the surfaces' fault: every control in the system was
a flat fill (`Button`, `Input`, `Textarea`, `NativeSelect`, `Checkbox`, the `Switch` thumb,
`Kbd`, the `TabsList` and `SegmentedControl` tracks, `AvatarFallback`, `CodeBlock`). A Card
read as glass and everything inside it read as paper.

It also fixes a measured bug: a `--panel` control on a `--panel` surface is **0/255 in both
themes**. An `Input` inside a `Panel` is exactly its backdrop's colour, identified by its 1px
border alone. A lit edge and an inset well give a control an identity that doesn't depend on
its fill differing from what it sits on , the only fix available, since `--panel` is what
both legitimately want to be.

Deliberately edge, light and depth, **not** more translucency , and that is measured rather
than assumed. A tier-S surface transmits 15% of its backdrop at α 0.85, so the page texture
arrives inside a Card at ~2/255, below perception. Lowering the alpha to let it through
breaks the perceptibility gate before it becomes visible; in light mode _nothing_ below 0.85
passes. The gate that makes a surface read as raised and the transparency that would make it
read as see-through are in direct opposition. Edges cost nothing from that budget.

Same light/dark asymmetry as the glass tier, for the same reason. Light's `--panel` is
`#FFFFFF` and a white lit edge over it measures **1.00:1 at every alpha**, so light's
`--control-lit` is `transparent` and its raised material is the shadow. Dark's lit edge reads
at 1.56:1 and _is_ the material , at α 0.14, a fraction of tier S's 0.50, because on a 36px
control that value is a bright white line.

`--control-shadow` is its own token rather than a reuse of `--shadow-sm` because `--shadow-sm`
is `none` in dark mode, and `none` inside a comma-separated `box-shadow` list invalidates the
whole declaration , which would silently delete dark mode's lit edge. Same trap as
`--glass-surface-shadow`. `cn` also gained a `control-material` class group: both classes set
`box-shadow` and are component classes rather than prefixed utilities, so tailwind-merge kept
both and let `controls.css` declaration order pick the winner.

## New tokens

| Token                       | Light                              | Dark                            |
| --------------------------- | ---------------------------------- | ------------------------------- |
| `--info` _(changed)_        | `#256262`                          | `#6FBAB9`                       |
| `--info-soft` _(changed)_   | `rgba(37, 98, 98, 0.12)`           | `rgba(111, 186, 185, 0.12)`     |
| `--rose`                    | `#9B3E6B`                          | `#DA8FB2`                       |
| `--rose-soft`               | `rgba(155, 62, 107, 0.12)`         | `rgba(218, 143, 178, 0.12)`     |
| `--on-danger`               | `#FFFFFF`                          | `#2A2B2A`                       |
| `--brand-hover`             | `#BCE52B`                          | `#BCE52B`                       |
| `--danger-hover`            | `#9E231E`                          | `#FF9A95`                       |
| `--glass-surface-bg-top`    | `rgba(255, 250, 247, 0.85)`        | `rgba(35, 36, 35, 0.85)`        |
| `--glass-surface-bg-bottom` | `rgba(253, 246, 241, 0.85)`        | `rgba(31, 32, 31, 0.85)`        |
| `--control-lit`             | `transparent`                      | `rgba(255, 255, 255, 0.14)`     |
| `--control-inset`           | `rgba(42, 43, 42, 0.07)`           | `rgba(0, 0, 0, 0.3)`            |
| `--control-shadow`          | `0 1px 2px rgba(42, 43, 42, 0.06)` | `0 1px 2px rgba(0, 0, 0, 0.35)` |
| `--page-texture-dot`        | `rgba(42, 43, 42, 0.03)`           | `rgba(0, 0, 0, 0.6)`            |
| `--page-texture-field`      | `rgba(89, 41, 65, 0.025)`          | `rgba(14, 6, 11, 0.5)`          |
| `--page-texture-grid`       | `48px`                             | `48px`                          |

`--rose` exists because it is a category colour that asserts no severity. Every other
chromatic token means a status or the brand, so categorical axes had to borrow `primary` and
came out blue.

## Components

- **`Badge`** gains `rose`.
- **`Button`** uses hover _tokens_ instead of `hover:brightness-95`. A filter is outside the
  palette , unmeasured, and it composites differently over glass than over an opaque panel.
  Also gains a GPU-composited press, fully suppressed under reduced motion.
- **`DataTable`** gains the `surface` passthrough it never had. The component most likely to
  be dropped inside a Card was the only one that couldn't opt out of nested glass.

## New entry points

`@velobitsio/ui/motion` , `PageTransition`, `Stagger`, `StaggerItem`, `FadeIn`.
Subpath-only, like `form`: the barrel's own-code budget has ~4 kB left, and nobody importing
a Button should pay for Framer's runtime. `framer-motion` was already a required peer and
until now bought exactly one `MotionConfig`. `Stagger` caps its cascade at 12 items so a
200-row list doesn't take eight seconds to arrive.

`@velobitsio/tokens` adds two CSS exports: `./texture.css` and `./controls.css`. Both are
added to the `attw --exclude-entrypoints` list alongside the existing CSS entries.

## Breaking

**Only for anyone reading the CSS variable directly.** `--glass-surface-bg` is replaced by
`--glass-surface-bg-top` and `--glass-surface-bg-bottom`. The public API is the
`.glass-surface` class, which is unchanged , this is a minor bump because the supported
surface didn't move.

Migration: if you referenced `--glass-surface-bg`, use `--glass-surface-bg-top` for the
equivalent value; it carries 0.1.0's alpha and near-identical colour in both themes.

## Peer range change

`@velobitsio/ui` widened its sibling peers from `^0.1.0` to `>=0.1.0` on
`@velobitsio/tokens` and `@velobitsio/icons`. `>=` also matches how every other peer in
that file is already spelled. No consumer action needed , the range only got wider.

## Verification

Three commits since the 0.1.0 tags, 66 files, +3134 / −202:

- `b3a583a` , feat: the whole change above, plus the changeset that declared it
- `c885c52` , fix: comment-only. Corrected the documented perceptibility measurements in
  `texture.css` from `dark 12→20 / 9→16` to `dark 12→25 / 9→22`. No changeset, and none
  needed: the changeset text already carried the corrected figures, so this brought the code
  comment in line with what was declared. Nothing user-facing ships undocumented.
- `f2bc22a` , chore: `changeset version`. Consumed the changeset, wrote both CHANGELOGs,
  bumped both `package.json`s, updated `package-lock.json`.

Components are authored in `registry/velobits/` and built into `packages/ui`, which is why
the component changes show up under `registry/` rather than `packages/ui/src/`. The registry
JSON under `apps/docs/public/r/` is regenerated output; `registry-parity.test.ts` asserts the
npm package and the shadcn registry never drift.

`@velobitsio/icons` has an empty diff against its 0.1.0 tag , confirmed with
`git diff --stat @velobitsio/icons@0.1.0..origin/main -- packages/icons/`.
