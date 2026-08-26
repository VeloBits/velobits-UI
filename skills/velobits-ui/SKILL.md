---
name: velobits-ui
description: Install, configure and write UI with the VeloBits design system, the @velobitsio/tokens, @velobitsio/icons and @velobitsio/ui npm packages, and the @velobits shadcn registry. Use when scaffolding an app that should use VeloBits, when running `shadcn add @velobits/...`, when writing or reviewing components that consume VeloBits tokens, and when VeloBits components arrive unstyled, throw on hover, flash the wrong theme, or need a colour the palette does not have.
---

# VeloBits UI

One token and component layer for every VeloBits surface. 48 semantic tokens, 41
components built on Radix and Tailwind v4, 201 stroke icons, a two-tier glass
material, and a contrast gate every colour pair has already passed.

Every component is authored once and shipped **twice**, as npm packages and as a
shadcn registry, so the two cannot diverge. Which one a project uses is forced by
its architecture, not by taste.

- Documentation: <https://ui.velobits.dev>
- Registry index, the authoritative item list: <https://ui.velobits.dev/r/registry.json>

Read the reference file for the job in hand instead of guessing:

| File                            | Read it when                                                                                                           |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `references/frameworks.md`      | Setting a project up: Next, Vite, React Router, TanStack Start, Astro, Laravel, monorepos, Module Federation, Keycloak |
| `references/shadcn-registry.md` | Anything involving `npx shadcn`: item names, install targets, pinning the origin, CI and air-gapped installs           |
| `references/npm-packages.md`    | The three packages: peers, subpath exports, versioning, publishing, Docker and CI auth                                 |
| `references/design-rules.md`    | Choosing tokens, glass, motion and icons; contrast and accessibility; what a colour change costs                       |

## 1. Choose the distribution

| The surface                                    | Use                           | Because                                                                                                                                                                   |
| ---------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Module-federated app (shell + remotes)         | **npm**                       | Federation needs `@velobitsio/ui` to be a real singleton so the shell's `TooltipProvider` context reaches into each remote. Copied files cannot cross a remote boundary.  |
| Existing Tailwind v4 + shadcn app              | **npm**                       | One `@theme inline` bridge is already there; the palette swap is one file.                                                                                                |
| Greenfield app, one-off surface, prototype     | **shadcn CLI**                | You own the source, there is no dependency to bump, and the components land in your own tree where Tailwind already scans them.                                           |
| Keycloak login theme, or any non-React surface | **`@velobitsio/tokens` only** | Keycloakify re-vends component sources through a `sync-extensions` postinstall hook, so an edit to an unclaimed file is silently reverted. Tokens are the one clean seam. |

Never mix the two component paths in one app. Two copies of `Tooltip` means two
Radix contexts, and the failure shows up as a throw on first hover.

## 2. Set up a new project

```bash
npx shadcn@latest init --template next   # next · vite · react-router · astro · laravel · start
npx shadcn@latest add @velobits/velobits --overwrite
```

`init` installs Tailwind v4, writes the CSS entry and creates `components.json`.
`add @velobits/velobits` installs the whole system: the token layer, `cn`, the
provider stack and every component. `@velobits` is a registered shadcn namespace,
so nothing needs adding to `components.json` for resolution to work.

`--overwrite` is right on a fresh scaffold and only there: it answers the `cn`
prompt (rule 4 below), and nothing in a new project has edits to lose. On an
existing project, run without it and answer that one prompt `yes`.

Then finish the wiring, which is the per-framework part: where the CSS entry
lives, where `VelobitsProvider` mounts, and where the theme init script goes. See
`references/frameworks.md` for the exact files. Fonts are named by the token layer
but deliberately not shipped by it, so install the faces too:

```bash
npm i @fontsource-variable/geist @fontsource-variable/jetbrains-mono
```

```css
@import '@fontsource-variable/geist';
@import '@fontsource-variable/jetbrains-mono';
```

## 3. Add VeloBits to an existing React app

```bash
npm i @velobitsio/tokens @velobitsio/icons @velobitsio/ui framer-motion
```

```css
/* the app's CSS entry, in this order */
@import '@velobitsio/tokens/theme.css';
@source "../node_modules/@velobitsio/ui/dist";
```

```tsx
import { THEME_STORAGE_KEYS, VelobitsProvider } from '@velobitsio/ui';

<VelobitsProvider storageKey={THEME_STORAGE_KEYS.dashboard}>{children}</VelobitsProvider>;
```

`framer-motion` is a **required** peer, not an optional one: the barrel imports
`MotionConfig` through `VelobitsProvider`, so an install without it fails to
resolve. `react-hook-form` is the only optional peer, needed solely by `Form`.

## 4. The rules that fail silently

Every one of these has a symptom that does not name its cause, which is why they
come before anything else.

1. **`@source "../node_modules/@velobitsio/ui/dist"` is not optional on the npm
   path.** Tailwind v4 does not scan `node_modules`, so utilities used inside the
   package are never generated and the components arrive **completely unstyled,
   with no warning anywhere**. Adjust the depth for the workspace layout. CLI
   consumers do not need the line, their copies sit in an already-scanned tree.
2. **`VelobitsProvider` mounts once, at the shell root.** It supplies the theme
   context, a `TooltipProvider` (Radix's tooltip **throws** without an ancestor
   provider, and only when someone hovers) and `MotionConfig reducedMotion="user"`.
3. **`storageKey` is required and deliberately not defaulted.** Two surfaces
   sharing a default key is a bug found in production. `THEME_STORAGE_KEYS`
   carries the two live keys, `editor` (`fmx_theme_mode`) and `dashboard`
   (`tf.theme`), so a migrating app keeps its users' preference instead of
   resetting it. A **new** surface passes its own string and neither of those two.
4. **Our `cn` has to win the overwrite prompt.** It installs to your `utils`
   alias, where shadcn puts its own, so a project ends up with one `cn` and not
   two. The CLI prompts and **defaults to no**; `--yes` does not cover that
   prompt, `--overwrite` does. Ours is a strict superset: same signature, same
   results on standard utilities, plus `rounded-pill`, the `z-*` ladder, the named
   durations, and a bidirectional `control-material` to `shadow` conflict group.
   Answering no leaves conflict resolution quietly broken across every VeloBits
   component, and two `box-shadow` declarations surviving on one element.
5. **`Form` and `Motion` are subpath-only, never in the barrel.** Import them as
   `@velobitsio/ui/form` and `@velobitsio/ui/motion`. `Form` needs the optional
   `react-hook-form` peer and the barrel is one bundled module, so a re-export
   would break every app that never installed it. `Motion` is a budget decision,
   nobody should download Framer's runtime to render a `Button`.
6. **The init script prevents the flash of wrong theme, and needs
   `suppressHydrationWarning`.** `themeInitScript(storageKey)` applies the stored
   theme before first paint. It mutates the element React is about to hydrate,
   which is exactly what that attribute is for. `@velobitsio/ui/theme` is
   React-free by design so a Server Component can call it.
7. **Tailwind v4 only.** The token layer is custom properties plus `@theme`; there
   is no v3 JS-config bridge, and `tailwind.config` is an empty string in
   `components.json` deliberately. If `shadcn add` ever appends its own
   `:root`/`.dark` oklch blocks below the import, delete them, they shadow the
   bridge with a stock grey palette.

## 5. Writing UI with it

**Imports depend on the distribution, and on nothing else.**

```tsx
// npm
import { Button, Card, cn } from '@velobitsio/ui';
import { CheckIcon } from '@velobitsio/icons';

// shadcn CLI, one file per component in a flat folder
import { Button } from '@/components/ui/velobits/button';
import { cn } from '@/lib/utils';
```

The CLI writes everything into `<aliases.ui>/velobits/`, flat, with `cn` at your
`utils` module. Only the `velobits/` segment is fixed; the prefixes come from the
consumer's `components.json`.

**Paint from tokens, never from Tailwind's palette.** `bg-blue-500`,
`text-gray-600` and a raw hex are all wrong here: they do not switch with the
theme, and they are not in the contrast gate.

| Want                 | Use                                                                             |
| -------------------- | ------------------------------------------------------------------------------- |
| Page, panel, raised  | `bg-bg`, `bg-bg2`, `bg-panel`, `bg-elevated`                                    |
| Body and muted text  | `text-fg`, `text-muted-foreground`, on glass `text-muted-on-glass`              |
| A link               | `text-link`                                                                     |
| Brand fill           | `bg-brand` with `text-on-brand`, the only sanctioned pairing                    |
| Primary fill         | `bg-primary` with `text-primary-foreground`                                     |
| Edges                | `border-border`, and `border-field-border` on controls                          |
| Status               | `bg-success` / `bg-success-soft`, likewise `danger`, `warning`, `info`, `rose`  |
| A solid danger fill  | `bg-danger` with `text-on-danger`, never white , white is 2.45:1 in dark        |
| Code and terminal    | `bg-code` with `text-on-code`                                                   |
| App chrome           | `bg-chrome` with `text-chrome-fg`, `text-chrome-muted-fg`, `text-chrome-accent` |
| Data viz             | `chart-1` through `chart-5`                                                     |
| Radii, motion, layer | `rounded-md` / `rounded-pill`, `duration-enter`, `z-modal`                      |

**Four rules the palette encodes.** `--primary` is not a text colour, it measures
3.86:1 on the paper page, so links use `text-link` and no `Button` variant paints
it as text. Lime is asymmetric, `bg-brand` with `text-on-brand` is the only
sanctioned pairing, and `--accent-text` is lime in dark and plum in light. Glass
has two tiers, and nesting them cancels them out. App chrome is plum in light and
black in dark, and **dark in both**, so none of the theme's own foregrounds apply
to it , `--fg` on `--chrome` is 1.23:1 in light and perfectly legible in dark,
which is why the tier ships its own `chrome-*` foregrounds (those ARE
theme-invariant) rather than borrowing. A control styled `text-fg` on this bar
looks finished in dark mode and is invisible in light. `references/design-rules.md` carries the rest, including what changing
a colour costs.

**Reach for a component's `surface` prop, not a `bg-*` utility.** A utility wins
the cascade and takes the material with it.

**Never branch on the resolved theme in JS.** The server has no `localStorage`, so
`theme === 'dark' ? <SunIcon /> : <MoonIcon />` renders the wrong branch, React
throws #418 and discards the server HTML. Render both and let CSS choose:
`<SunIcon className="hidden dark:block" />` beside
`<MoonIcon className="dark:hidden" />`, and keep the `aria-label` static for the
same reason. `useTheme().mounted` is the escape hatch for what CSS genuinely
cannot express, such as printing the current mode as text.

## 6. What already exists, so nothing gets rebuilt

49 registry items: 41 components in three tiers, plus the foundation. Check this
list before writing a component from scratch, and check `/r/registry.json` before
concluding something is missing. Both numbers and every name below are asserted
against the registry by `packages/ui/test/skill-parity.test.ts`, so this list
cannot quietly fall behind the code it describes.

- **Foundation** `velobits` (installs everything), `velobits-theme`, `cn`,
  `theme`, `velobits-provider`, `use-theme`, `use-media-query`, `use-row-selection`
- **Primitives** `glass-surface`, `card`, `alert`, `button`, `badge`, `input`,
  `textarea`, `select`, `native-select`, `checkbox`, `switch`, `slider`, `label`,
  `field`, `avatar`, `kbd`, `separator`, `skeleton`, `spinner`, `tooltip`,
  `scroll-area`
- **Overlays** `dialog`, `side-panel`, `popover`, `dropdown-menu`, `toast`,
  `command-palette`
- **Composites** `app-shell`, `data-table`, `table`, `form`, `accordion`, `tabs`,
  `segmented-control`, `status-chip`, `empty-state`, `pagination`, `breadcrumb`,
  `code-block`, `diff-viewer`, `motion`

There are TWO dropdowns and they are not interchangeable. `select` is the default
, Radix underneath, so the open panel is a glass surface you can style, with a
check indicator and `sm`/`default` sizes. `native-select` is a real `<select>`,
for when the platform's own picker IS the design (a mobile-first form) or a form
post needs a native control in the payload. There is no `sheet` (it is
`side-panel`) and no `sonner` (it is `toast`). Icons come from
`@velobitsio/icons`, not lucide, and every export name ends in `Icon`.

Two commands read the registry directly, and both beat guessing:

```bash
npx shadcn@latest search @velobits --query "table"
npx shadcn@latest view @velobits/data-table   # prints deps and targets, writes nothing
```

## 7. When something looks wrong

| Symptom                                                  | Cause                                                                       |
| -------------------------------------------------------- | --------------------------------------------------------------------------- |
| Components render but are completely unstyled            | The `@source` line is missing, or its depth is wrong                        |
| Throws on first hover                                    | `VelobitsProvider` is not mounted, so there is no `TooltipProvider`         |
| The theme flashes light and then corrects itself         | The init script is missing from the document head                           |
| Hydration error #418 near a theme control                | Markup branches on the resolved theme, see section 5                        |
| Conflicting classes both survive, two shadows on one box | Stock shadcn `cn` won the overwrite prompt                                  |
| `rounded-pill` or `z-modal` does nothing                 | Same cause, or a dev server that needs restarting after a token rename      |
| A glyph renders as tofu                                  | The font faces were never installed, so everything fell back to `system-ui` |
| Borders look light in dark mode                          | Something bridged `--color-border` where it must say `--border`             |
| `does not provide an export named 'default'`, blank page | Federation `requiredVersion` pins are behind the installed `@velobitsio/ui` |

## 8. Do not

- Do not invent token names. If a colour is not in the table above or in
  `@velobitsio/tokens`, it does not exist, and adding one means measuring it.
- Do not hand-edit the neutral ramp. It is generated and machine-checked.
- Do not put glass on page backgrounds, on rows inside a scroll container, or
  nested inside other glass.
- Do not use colour as the only signal for a state. Every status ships a distinct
  glyph precisely so it does not have to.
- Do not add a registry item, a tsup entry or a package export on its own. Adding
  a component means four lists agreeing, and a parity test fails if one lags.
- Do not pass `--overwrite` habitually. You own the copied components, so a later
  run discards your edits to them as well.
