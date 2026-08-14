# @velobitsdevs/tokens

The VeloBits design tokens — colour, type, spacing, motion and the glass
material — as CSS custom properties and as TypeScript.

**Zero dependencies and zero React.** That is deliberate: the shared Keycloak
login theme cannot consume a React package, so the token layer has to stand on
its own.

## Install

```bash
npm install @velobitsdevs/tokens
```

## Use

Import the theme once, at the root of your app:

```css
@import '@velobitsdevs/tokens/theme.css';
```

That single import brings in `tailwindcss`, `tw-animate-css`, the raw tokens and
the glass material, and registers the `dark` variant. Four entry points are
exported if you need them individually:

| Entry point                        | What it holds                                       |
| ---------------------------------- | --------------------------------------------------- |
| `@velobitsdevs/tokens/theme.css`       | The one you want. Everything below, wired together. |
| `@velobitsdevs/tokens/tokens.css`      | The raw custom properties, light and dark.          |
| `@velobitsdevs/tokens/glass.css`       | The two-tier glass material only.                   |
| `@velobitsdevs/tokens/keycloakify.css` | The bridge for the Keycloak login theme.            |

The same values are available to TypeScript, for anything that has to compute
rather than declare:

```ts
import { contrastRatio, themes } from '@velobitsdevs/tokens';
```

`themes` holds the `light` and `dark` semantic sets (both are exported
individually too), alongside colour maths such as `contrastRatio`,
`compositeOver` and the OKLCH conversions.

## Two things that will bite you

- **Write `var(--border)`, never `var(--color-border)`.** The latter resolves
  against `:root` and inherits the light value straight into dark mode. It looks
  like a palette bug and is a bridge bug.
- **Do not alias tokens with `:root { --x: var(--y) }`.** `var(--y)` resolves
  where it is _declared_, which pins light values across dark mode. Use
  `@theme inline`, which resolves at the use site.

## Colour is gated, not eyeballed

Every semantic colour pair is contrast-asserted in both themes as a test, so a
palette edit that breaks a WCAG target fails CI instead of shipping. That
includes the composited cases that are easy to miss — text on a soft chip wash
measured over the page, over a panel, and over the glass surface composite.

## Licence

Proprietary. See [LICENSE](./LICENSE). Published publicly for VeloBits' own
build pipelines; this is not an offer of licence.
