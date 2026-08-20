# The @velobits shadcn registry

`ui.velobits.dev` is two things at one origin: the documentation, and the registry
the shadcn CLI fetches. Both come out of one build, so the docs and the JSON the
CLI installs are always the same revision.

## Three ways to address an item, in order of preference

**By namespace.** `@velobits` is a registered shadcn namespace, so it resolves
through shadcn's public index with no configuration in any project that has run
`init`. Needs a current CLI (v3 or newer).

```bash
npx shadcn@latest add @velobits/button
npx shadcn@latest add @velobits/data-table @velobits/use-row-selection
npx shadcn@latest add @velobits/velobits          # everything
```

**By full URL.** No index lookup, no configuration, works on any CLI version. This
is the form for CI scripts and one-off scaffolds, because it depends on nothing:

```bash
npx shadcn@latest add https://ui.velobits.dev/r/button.json
```

**By explicit mapping in `components.json`.** Pins the origin and takes precedence
over the index, so it is also how a project points at a staging copy or an internal
mirror:

```json
{
  "registries": {
    "@velobits": "https://ui.velobits.dev/r/{name}.json"
  }
}
```

`{name}` is substituted per item, so `@velobits/button` fetches
`https://ui.velobits.dev/r/button.json`.

## The commands that matter

| Command                                     | Does                                                                                   |
| ------------------------------------------- | -------------------------------------------------------------------------------------- |
| `shadcn init`                               | Creates `components.json`, installs Tailwind, writes the CSS entry                     |
| `shadcn init --template <name>`             | Scaffolds a whole project: `next`, `vite`, `react-router`, `astro`, `laravel`, `start` |
| `shadcn add @velobits/<name>`               | Installs an item, its npm dependencies and its registry dependencies                   |
| `shadcn view @velobits/<name>`              | Prints dependencies, registry dependencies and file targets. Writes nothing            |
| `shadcn search @velobits --query "table"`   | Lists items, read from `/r/registry.json`                                              |
| `shadcn docs <name>`                        | API reference for shadcn's own primitives, not for this registry. `view` is ours       |
| `shadcn info`                               | Project diagnostics: resolved config, installed components, aliases                    |
| `shadcn mcp init --client claude`           | Registers the shadcn MCP server so an agent can search and install directly            |
| `shadcn build registry.json --output <dir>` | The publishing side. Runs inside this repo's build, never by hand                      |

Useful `add` flags: `--overwrite` (replace existing files), `--path <dir>` (write
somewhere other than the alias), `--cwd <dir>` (run against another directory,
which is what a monorepo needs), `--yes` (skip confirmations, but see below).

VeloBits ships no CLI of its own. It is a standard shadcn registry, and the
standard commands are the whole interface.

## The one prompt `--yes` does not cover

Our `cn` installs to your `utils` module, deliberately, so a project ends up with
one `cn` rather than two. If a file is already there the CLI asks, and defaults to
no:

```
? The file cn.ts already exists. Would you like to overwrite? » (y/N)
```

`--yes` does not suppress that particular prompt, so an unattended run sits on it.
`--overwrite` answers it and is non-interactive.

Ours is a strict superset of shadcn's: identical signature, identical results on
every standard utility, plus the class groups this system needs, `rounded-pill`,
the `z-*` ladder, the named durations, and a bidirectional `control-material` to
`shadow` conflict group. That last one matters most, without it two `box-shadow`
declarations survive on the same element.

So overwriting is safe for existing shadcn components, and **not** overwriting is
what quietly degrades ours. It is still not a habit worth forming: you own the
copied components, so a later `--overwrite` run discards your edits to them too.

## Where the files land

One flat folder inside the consumer's `ui` alias, plus `cn` at their `utils`
module:

```
components/ui/velobits/
  button.tsx
  card.tsx
  data-table.tsx
  table.tsx
  use-theme.tsx
  theme.ts
  velobits-provider.tsx
lib/utils.ts          ← our cn
```

| Type             | Example                       | Lands in                                     |
| ---------------- | ----------------------------- | -------------------------------------------- |
| `registry:style` | `@velobits/velobits`          | everything below                             |
| `registry:theme` | `@velobits/velobits-theme`    | the CSS entry, as `:root` and `.dark` blocks |
| `registry:ui`    | `@velobits/button`            | `components/ui/velobits/`                    |
| `registry:hook`  | `@velobits/use-row-selection` | `components/ui/velobits/`                    |
| `registry:lib`   | `@velobits/theme`             | `components/ui/velobits/`                    |
| `registry:lib`   | `@velobits/cn`                | `lib/utils.ts`, the `utils` alias            |

Every item carries an explicit `target`, so placement does not follow the CLI's
per-type default. `components/ui/` and `lib/` come from **your**
`components.json`; only the `velobits/` segment is fixed. A project whose
`aliases.ui` is `@/parts/widgets` gets `parts/widgets/velobits/`.

Flat is deliberate. The components import each other as siblings (`./table`,
`./tooltip`), so one folder makes those true by construction. The build rewrites
the sources' relative specifiers on the way out and then asserts that no parent
specifier survived, because one that does cannot resolve where the files land, and
that failure appears in the consumer's build rather than in ours.

## What is in the JSON

Each item at `/r/<name>.json` follows the shadcn registry-item schema:

- `dependencies`, npm packages to install
- `registryDependencies`, other items to pull in first, resolved within this
  registry as absolute URLs so they work from any addressing form
- `files`, the source plus the target path it lands at
- `cssVars`, only on `velobits-theme`, which carries the whole token layer

The theme item's variables are derived from `@velobitsio/tokens` at build time
rather than typed twice, so a palette change flows into the registry on the next
build, and a test fails if the committed JSON is stale.

Installing one item brings what it needs: `add @velobits/data-table` also installs
`table`, `cn` and `use-row-selection` without naming them.

## The agent skill is itself an installable item

```bash
npx shadcn@latest add @velobits/skill          # .claude/skills/velobits-ui/
npx shadcn@latest add @velobits/skill-cursor   # .cursor/rules/
```

Either one writes this guidance into the project, so an agent working in that repo
has it without being handed it. They are `registry:file` items, not components, so
installing one pulls in no dependencies and touches no source file.

**They resolve by namespace but do not appear in `search`,** and those two facts are
not in tension. `search` reads `/r/registry.json`, the component index, which these
are deliberately absent from. `add` never consults it: the public index maps
`@velobits` to the template `https://ui.velobits.dev/r/{name}.json` and substitutes
the name, so any file this registry serves resolves, indexed or not.

Both need a `components.json` in the project like any other `add`; without one, fetch
the files directly:

```bash
curl -sSfL https://ui.velobits.dev/skills/velobits-ui/SKILL.md -o SKILL.md
```

## Caching and CORS

`/r/*.json` is served `public, max-age=0, must-revalidate`. A component's source
changes under a stable URL, so a long-lived cache means installing last month's
file. The payloads are small and the revalidation is a 304.

The files are also served `Access-Control-Allow-Origin: *`. The CLI is a Node
process and CORS never applied to it; this is for browser-based consumers such as
v0.

## CI, mirrors and air-gapped installs

Use the **full URL** form. It needs no `registries` entry and no index lookup, so
it cannot break on a CLI version bump or an index change.

To point a build at a different origin, add the explicit mapping to
`components.json`; it beats the public index. Mirroring means serving the same
`/r/*.json` tree from another host, and the only thing to watch is that
`registryDependencies` inside those files carry absolute URLs baked in at build
time, so a mirror needs its files rebuilt with `REGISTRY_BASE_URL` set to its own
origin, not merely copied.

## Publishing side, in this repository

`registry/registry.ts` is the typed source. `scripts/build-registry.ts` validates
it and compiles it with `shadcn build` into `apps/docs/public/r/`, and the static
docs export ships that folder, so deploying the docs deploys the registry.

Two validations run before the compile, and both exist because the failure they
prevent happens on a consumer's machine rather than in our CI: every file an item
declares must exist, and every `registryDependency` must resolve to something in
the registry. Adding a component means four lists agreeing, `registry/registry.ts`,
`packages/ui/tsup.config.ts`, the `exports` map in `packages/ui/package.json` and
the barrel, and `packages/ui/test/registry-parity.test.ts` fails naming whichever
one lags.
