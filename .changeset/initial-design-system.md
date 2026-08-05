---
'@velobits/tokens': minor
'@velobits/icons': minor
'@velobits/ui': minor
---

Initial release of the VeloBits design system.

- `@velobits/tokens` — the brand palette as CSS and TypeScript, on a generated
  warm neutral ramp. Zero dependencies and zero React, so the Keycloak login
  theme can consume it. Every semantic colour pair is contrast-asserted in both
  themes, and the glass tier is measured over the seven worst-case backdrops in
  the palette using gamma-space compositing.
- `@velobits/icons` — 88 hand-drawn stroke icons, merged from the two sets that
  had diverged across ToggleFlow and FixMyText. Every existing name is preserved.
- `@velobits/ui` — Tier 0 foundation (theme provider, `cn`, reduced-motion
  config) and the 18 Tier-1 primitives, published to npm and simultaneously
  served as a shadcn registry from the same source.
