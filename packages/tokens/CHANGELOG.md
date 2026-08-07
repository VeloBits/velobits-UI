# @velobits-dev/tokens

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
