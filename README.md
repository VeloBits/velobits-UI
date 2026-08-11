# velobits-ui

The VeloBits design system. One token and component layer for every VeloBits
surface: the marketing site, the editor app, the dashboard app, and the shared
Keycloak login theme.

> Implementation notes and the full plan live at workspace
> `docs/VelobitsUI/`, not in this repo, per the standing convention.

```bash
npm install
npm run build          # EVERYTHING — see below
npm run test           # includes the contrast gate
npm run docs           # docs site on :4100, with codegen
npm run docs:serve     # serve the built static export on :4100
npm run registry:build # just the registry, if you want it alone
```

## One build, one artefact

`npm run build` produces **`apps/docs/out/`**, and that folder is the whole
deployable — the documentation and the registry the shadcn CLI fetches, at one
origin. Deploy it to `ui.velobits.dev` and both halves ship together.

```
npm run build
  1  packages/{tokens,icons,ui}          tsup → dist/
  2  scripts/build-registry.ts           registry/registry.ts → registry.json
                                         → apps/docs/public/r/*.json  (shadcn build)
  3  scripts/build-docs-data.ts          example sources, prop tables extracted
                                         from the TS types, search index
  4  next build (output: 'export')       → apps/docs/out/
                                              index.html
                                              docs/components/button/index.html
                                              r/button.json
                                              r/registry.json
                                              _headers
```

Steps 2 and 3 run from the docs app's own `build` script, and turbo's
`dependsOn: ["^build"]` guarantees the packages are built first — which step 2
needs, since it imports `@velobits-dev/tokens`.

### Deploying

Any static host. `apps/docs/public/_headers` is copied into `out/` and is read
directly by **Cloudflare Pages** and **Netlify**. For other hosts, the two rules
that matter are CORS on `/r/*` (for browser-based consumers — the CLI is a Node
process and never needed it) and no long-lived cache on it, since a component's
source changes under a stable URL:

```nginx
# nginx
location /r/ {
  add_header Access-Control-Allow-Origin *;
  add_header Cache-Control "public, max-age=0, must-revalidate";
}
location / { try_files $uri $uri/ /404.html; }
```

```json
// vercel.json
{
  "headers": [
    {
      "source": "/r/(.*)",
      "headers": [
        { "key": "Access-Control-Allow-Origin", "value": "*" },
        { "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }
      ]
    }
  ]
}
```

`REGISTRY_BASE_URL` overrides the origin baked into `registryDependencies` — set
it to point a build at a local server and verify an install end to end:

```bash
REGISTRY_BASE_URL=http://localhost:4100 npm run build
npm run docs:serve
# in a scratch app whose components.json maps @velobits at localhost:
npx shadcn@latest add @velobits/velobits --overwrite && npx tsc --noEmit
```

That last `tsc` is the check worth keeping. The CLI half is copy-and-paste, so it
can install cleanly and still not compile — which is exactly what it did until the
imports were rewritten. See `scripts/registry-layout.ts`.

## Where the CLI puts things

Everything lands in **one flat folder** inside the consumer's `ui` alias, with `cn`
at their `utils` module:

```
components/ui/velobits/button.tsx      import { cn } from '@/lib/utils'
components/ui/velobits/data-table.tsx  import { Table } from './table'
components/ui/velobits/use-theme.tsx
lib/utils.ts                           ← our cn, a superset of shadcn's
```

The prefixes are placeholders (`@ui/`, `@lib/`) resolved against the consumer's
`components.json`; only `velobits/` is fixed. Targets and the import rewrites both
come from `scripts/registry-layout.ts`, which `build-registry.ts` stamps and
`build-docs-data.ts` reads for the docs — so the path in the documentation cannot
disagree with the path the CLI uses.

## Layout

```
velobits-UI/
├── registry/velobits/        ← THE SOURCE. Authored once, shipped twice.
│   ├── ui/*.tsx              Tier-1 primitives
│   ├── lib/                  cn, theme resolution (React-free)
│   ├── hooks/                useTheme, useMediaQuery
│   └── providers/            VelobitsProvider
├── registry/registry.ts      → registry.json → apps/docs/public/r/*.json
├── packages/
│   ├── tokens/  @velobits-dev/tokens   CSS + TS. ZERO deps, ZERO React.
│   ├── icons/   @velobits-dev/icons    88 hand-drawn stroke icons
│   └── ui/      @velobits-dev/ui       builds from registry/velobits
├── scripts/
│   ├── build-registry.ts     validates + compiles the shadcn registry
│   └── build-docs-data.ts    docs codegen: examples, prop tables, search index
└── apps/docs/
    ├── app/docs/components/[slug]/   ONE route, every registry item
    ├── content/components.ts         per-component prose (optional, validated)
    ├── registry/examples/*.tsx       one file per example — preview AND code tab
    └── lib/generated/                codegen output (gitignored)
```

Adding a component means touching four lists — `registry/registry.ts`,
`packages/ui/tsup.config.ts`, the `exports` map in `packages/ui/package.json`,
and the barrel — and `packages/ui/test/registry-parity.test.ts` fails if you miss
one. It then gets a documentation page automatically; `apps/docs/lib/docs-nav.ts`
only decides which sidebar heading it appears under, and the build fails naming
any item that file does not place.

## Two distributions, and which one to use is not taste

| Consumer                      | Path                            | Why                                                                                                                                                                                                                   |
| ----------------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| the editor app                | **npm**                         | Module Federation needs `@velobits-dev/ui` to be a real singleton, so the shell's `TooltipProvider` context reaches into each remote. Copied files cannot cross a remote boundary.                                    |
| the dashboard app dashboard   | **npm**                         | Already Tailwind v4 + shadcn with one `@theme inline` bridge; the palette swap is one file.                                                                                                                           |
| Keycloak login theme          | **`@velobits-dev/tokens` only** | Its component sources are git-ignored and re-vended by a `keycloakify sync-extensions` postinstall hook — an edit to an unclaimed file is silently reverted on the next `npm install`. Tokens are the one clean seam. |
| Greenfield / one-off surfaces | **shadcn CLI**                  | `npx shadcn@latest add @velobits/button`. You own the source; no dependency to bump.                                                                                                                                  |

Adding a component means touching four lists, and
`packages/ui/test/registry-parity.test.ts` fails if you miss one:
`registry/registry.ts`, `packages/ui/tsup.config.ts`, the `exports` map in
`packages/ui/package.json`, and the barrel `registry/velobits/index.ts`.

## Consuming it

```css
/* your app's CSS — one import */
@import '@velobits-dev/tokens/theme.css';

/* NOT OPTIONAL: Tailwind v4 does not scan node_modules, so utilities used
   INSIDE @velobits-dev/ui are never generated and the components arrive completely
   unstyled with no warning anywhere. */
@source "../node_modules/@velobits-dev/ui/dist";
```

```tsx
import { THEME_STORAGE_KEYS, VelobitsProvider } from '@velobits-dev/ui';

// Once, at the shell root. Radix's Tooltip THROWS without a provider ancestor.
<VelobitsProvider storageKey={THEME_STORAGE_KEYS.dashboard}>{children}</VelobitsProvider>;
```

The storage key is required and deliberately not defaulted: the editor app persists
to `fmx_theme_mode` and the dashboard app to `tf.theme`, both with live user data, so a
default would silently orphan one app's preferences.

## Three things that will bite you

**`--primary` is not a text colour.** `#007ACC` measures **3.90:1** on the cream
page — fine as a fill behind white text (4.51:1), a WCAG failure as text. Links
use `text-link`. No `Button` variant paints it as text, and a test enforces that.

**Lime is asymmetric.** `bg-brand` + `text-on-brand` (charcoal) is 10.89:1 and is
the only sanctioned pairing — white on lime is 1.31:1. Lime _as text_ is 13.24:1
in dark mode and 1.13:1 in light, so `--accent-text` is lime in dark and plum in
light. A lime fill also cannot be a lone graphical indicator in light mode.

**Glass is the overlay tier only.** Dialog, Sheet, Popover, DropdownMenu, Toast,
CommandPalette, sticky headers. Never page backgrounds, table rows, anything
inside a scroll container, or nested.

## The gates

| Gate                | What it protects                                                                                                                                                                                                           |
| ------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **contrast test**   | Every semantic pair against its WCAG target in both themes, plus every glass tier over the seven worst-case backdrops. Composited in **gamma-encoded sRGB** — measuring in linear light overstates glass legibility badly. |
| CSS ↔ TS drift test | `css/tokens.css` and `src/semantic.ts` describe the same values; neither can move alone.                                                                                                                                   |
| ramp round-trip     | The generated neutral ramp is machine-checked, so "never hand-edit" is enforced rather than requested.                                                                                                                     |
| axe (`packages/ui`) | Structural a11y on every primitive. Contrast rules are explicitly **disabled** there — happy-dom has no cascade, and the token suite measures values directly instead.                                                     |
| registry parity     | The four lists above agree.                                                                                                                                                                                                |
| `publint` + `attw`  | The exports map and `.d.ts` resolution — the things that break quietly across the TS 6.0.3 / ~6.0.2 / 5.9.3 consumer skew.                                                                                                 |
| `size-limit`        | Per-entry budgets, the only real proof tree-shaking works.                                                                                                                                                                 |

## Gotchas encoded in this repo

- **The base border reset must say `var(--border)`, never `var(--color-border)`.**
  A `@theme` var is emitted as a real `:root` declaration, so it resolves to the
  light value and inherits everywhere — `body.dark` never reaches it.
- **`'use client'` needs two tsup builds.** esbuild strips directives from
  bundled modules, and tsup's `treeshake` (a Rollup pass) strips the `banner`
  that re-adds them. `lib/theme.ts` must stay directive-free so a Server
  Component can call `themeInitScript()`.
- **Custom scale values need registering with `tailwind-merge`.** It cannot
  resolve a conflict it does not recognise, so `rounded-pill` left `rounded-md`
  in place and the winner was decided by stylesheet order.
- **Icons need `/*#__PURE__*/`.** `sideEffects: false` describes the module, not
  each initialiser; without the annotation, importing one icon cost 3.4 kB of the
  set's 3.92 kB.
- **Renaming a `@theme` token needs a dev-server restart.** Tailwind's candidate
  cache lies through HMR.
- **`z-*` and `duration-*` are `@utility` rules, not theme values.** Tailwind v4
  has no `--z-index-*` or `--duration-*` namespace, so declaring them in `@theme`
  emits a variable and no utility — `z-tooltip` would silently do nothing.

## Publishing

GitHub Packages, private, `@velobits-dev/*`. Every published change needs a
changeset (`npm run changeset`). `@velobits-dev/tokens` versions independently so a
palette tweak does not force a component release.

Reads require auth even for consumers. In Docker use a **BuildKit secret**
(`RUN --mount=type=secret,id=npmrc`), never an `ARG` — an `ARG` is recorded in
the image history.

When `@velobits-dev/ui` gets a new version, the editor app's Federation
`requiredVersion` pins in `apps/shell`, `apps/editor-remote` and
`apps/analytics-remote` must move in lockstep. Overshooting the pin gives
`does not satisfy` warnings and then a fatal
`does not provide an export named 'default'` — a blank page, not a build error.
