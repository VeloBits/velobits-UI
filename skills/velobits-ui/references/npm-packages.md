# The npm packages

Three packages, published to **npmjs.org** under the `@velobitsio` scope with
`access: public`, so reading needs no token in any consumer CI or Docker build.

| Package              | What it is                                                     | Depends on                                                                                    |
| -------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| `@velobitsio/tokens` | CSS + TS tokens. **Zero deps, zero React.**                    | nothing                                                                                       |
| `@velobitsio/icons`  | 201 hand-drawn stroke icons                                    | `react` (peer)                                                                                |
| `@velobitsio/ui`     | The components, built from the same source the registry serves | tokens, icons, react, react-dom, **framer-motion** (peers), `react-hook-form` (optional peer) |

`tokens` is split out because the Keycloak login theme cannot consume
`@velobitsio/ui` at all, and versions independently so a palette tweak does not
force a component release.

```bash
npm i @velobitsio/tokens @velobitsio/icons @velobitsio/ui framer-motion
```

`framer-motion` is a **required** peer. The barrel imports `MotionConfig` through
`VelobitsProvider`, so an install without it fails to resolve. `react-hook-form`
is the only optional peer, needed solely by `Form`, which is why `Form` ships on
its own subpath and never in the barrel.

## The scope is an account name, not a label

`@velobitsio` resolves to an npm org or user of that exact name. Publishing
requires that org to exist with the publishing account a member with write access,
and there is no config that decouples the two.

The failure does not say so. npm answers "you may not write to this scope" with a
**404 on the PUT**, not a 403, because it will not confirm which names exist in a
scope you cannot see. So a permission problem reads as:

```
E404 Not Found - PUT https://registry.npmjs.org/@velobitsio%2ficons
```

for a package the publish is itself trying to create. A granular token must grant
read and write on the **whole** scope; per-package selection cannot cover a package
the registry does not have yet, which is every package in a first publish, and it
fails with the same masked 404. A classic Automation token also works and bypasses
2FA.

`@velobits-dev/*` was the previous scope and the only one ever published from.
Those packages were removed from npm and nothing forwards, so a consumer still on
them migrates by changing the specifier.

**The shadcn namespace `@velobits` is a different thing entirely.** It is resolved
from a registry URL in `components.json`, never from npm, so
`npx shadcn@latest add @velobits/button` is unaffected by any of the above.

## Auth, and where the token comes from

| Where    | How                                                                                                                  |
| -------- | -------------------------------------------------------------------------------------------------------------------- |
| CI       | `actions/setup-node` with `registry-url` writes the auth line from `NPM_TOKEN`. npmjs does not accept `GITHUB_TOKEN` |
| Local    | `npm config set //registry.npmjs.org/:_authToken <token>` in `~/.npmrc`                                              |
| Consumer | nothing, the packages are public                                                                                     |

Never commit `//registry.npmjs.org/:_authToken=${VAR}` to a repo `.npmrc`: npm
hard-fails on an unresolvable `${VAR}`, which breaks a plain `npm install` for
anyone without that variable exported. If these packages are ever made private
again, use a BuildKit secret in Docker (`RUN --mount=type=secret,id=npmrc`) and
never an `ARG`, which is recorded in the image history.

## The two CSS lines, and why the second is not optional

```css
@import '@velobitsio/tokens/theme.css';
@source "../node_modules/@velobitsio/ui/dist";
```

Tailwind v4 does not scan `node_modules`, so every utility used inside
`@velobitsio/ui` goes ungenerated and the components arrive completely unstyled
with no warning anywhere. `cva` class strings survive into `dist` as string
literals, which is what makes scanning it work. The path is relative to the CSS
file, so adjust the depth for the workspace layout.

`@velobitsio/tokens` also exports narrower entries for cases that do not want the
whole Tailwind setup: `tokens.css` (the raw variables), `glass.css`,
`controls.css`, `texture.css`, `scrollbar.css`, and `keycloakify.css`. The TS side exports the same
values, `light` and `dark`, for anything that needs a colour in JS, such as a chart
library.

## Subpath exports

The barrel covers almost everything:

```tsx
import { Button, Card, Dialog, useTheme, cn } from '@velobitsio/ui';
```

Two exports are reachable **only** as subpaths, for two different reasons:

```tsx
import { Form, FormField } from '@velobitsio/ui/form'; // optional peer
import { PageTransition, Stagger } from '@velobitsio/ui/motion'; // bundle budget
```

`Form` needs `react-hook-form`, and the barrel is one bundled module, so a
re-export would put a top-level `import 'react-hook-form'` in `dist/index.js` and
break every app that never installed it. `Motion` is a budget decision: anything in
the barrel is paid for by every consumer whether they import it or not.

Every other component also has its own subpath (`@velobitsio/ui/button`,
`@velobitsio/ui/data-table`, and so on), which is what makes per-entry size budgets
measurable. Use the barrel unless something is measuring.

`@velobitsio/ui/theme` is the React-free entry: `THEME_STORAGE_KEYS`,
`themeInitScript`, `resolveTheme`, `applyTheme`, `readStoredMode`. A Server
Component can call these; the hooks it sits beside cannot.

## Versioning and releases

Changesets. Every published change needs one (`npm run changeset`), and
`@velobitsio/tokens` versions independently of the components.

`publint` and `attw` run in CI over the exports map and the `.d.ts` resolution,
which is the pair of things that breaks quietly across the TypeScript version skew
between consumers.

## Module Federation pins

When `@velobitsio/ui` gets a new version, the `requiredVersion` pins in every
federated config move in lockstep, the shell and each remote. Overshooting the pin
gives `does not satisfy` warnings and then a fatal
`does not provide an export named 'default'`, which presents as a blank page rather
than a build error.

`@velobitsio/ui`, `@velobitsio/icons` and `framer-motion` all need
`singleton: true`. The provider's context must cross the remote boundary, and it
cannot if each remote instantiates its own copy of the module.

## Icons

```tsx
import { FlagIcon } from '@velobitsio/icons';

<FlagIcon size={16} />;
```

201 icons on a 24×24 grid, tuned to read at 13 to 18px. Every export name ends in
`Icon`. The package is `sideEffects: false` and every export is a plain function,
so bundlers drop what is not referenced without per-icon entry points, and
`size-limit` asserts that in CI rather than assuming it.

Do not add lucide alongside them for the same glyph. Two icon sets in one surface
is the divergence this package exists to end.
