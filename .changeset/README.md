# Changesets

Every published change needs one. `npm run changeset`, then commit the generated
markdown alongside the code.

## Why the three packages version independently

`@velobitsio/tokens` is deliberately NOT in the `fixed` array. A palette tweak
should not force a `@velobitsio/ui` release, because four repos consume these and
each release is a lockfile change plus — for the editor app — a Module Federation
`requiredVersion` bump in three vite configs.

## The Federation pin is the thing to remember

When `@velobitsio/ui` gets a new version, the editor app's `shared` map in
`apps/shell`, `apps/editor-remote` and `apps/analytics-remote` must be bumped in
lockstep. Exceeding the pin produces `does not satisfy` warnings and then a fatal
`does not provide an export named 'default'` — a blank page, not a build error.
