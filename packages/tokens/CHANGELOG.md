# @velobits-dev/tokens

## 0.2.0

### Minor Changes

- f22cce4: Initial release of the VeloBits design system.

  - `@velobits-dev/tokens` — the brand palette as CSS and TypeScript, on a generated
    warm neutral ramp. Zero dependencies and zero React, so the Keycloak login
    theme can consume it. Every semantic colour pair is contrast-asserted in both
    themes, and the glass tier is measured over the seven worst-case backdrops in
    the palette using gamma-space compositing.
  - `@velobits-dev/icons` — 88 hand-drawn stroke icons, merged from the two sets that
    had diverged across the two consuming apps. Every existing name is preserved.
  - `@velobits-dev/ui` — Tier 0 foundation (theme provider, `cn`, reduced-motion
    config) and the 18 Tier-1 primitives, published to npm and simultaneously
    served as a shadcn registry from the same source.
