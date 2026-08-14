# Releasing

Two workflows, two branches, one rule to internalise: **an npm version number is
permanent.** Unpublish is a 72-hour window, and after it the number is burned
forever — `ui@0.3.0` can never mean anything else. Everything below exists to put
a human in front of that.

|                         |                                                                                                                                                      |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Version bump happens on | `develop`, via **Prepare release** (manual dispatch)                                                                                                 |
| Publish happens on      | `main`, via **Release** (automatic on push, dispatch as retry)                                                                                       |
| Why the split           | `main`'s `protect-main` ruleset requires a PR + 1 approval + `verify`, bypass `OrganizationAdmin` only. No workflow can push a version commit there. |
| The review gate         | The `develop → main` PR. It carries the version bump, so no extra PR exists.                                                                         |

## Steady-state release

1. **Check what is queued.** On `develop`, with dependencies installed:
   `npm run changeset -- status --since=origin/main`. If it lists nothing, there is
   nothing to release. (Use the npm script, not `npx changeset` — `changeset` is not
   the package name, so `npx` tries to fetch a different package when
   `node_modules` is missing.)
2. **Dispatch _Prepare release_** on `develop` (Actions → Prepare release → Run
   workflow). It consumes the changesets, commits `chore: version packages` to
   `develop`, and opens or updates the `develop → main` PR with the exact versions
   in the body.
3. **Read the PR.** This is the review point. Check the version numbers, and skim
   the `CHANGELOG.md` diff — that text becomes the GitHub Release body verbatim.
4. **Wait for `verify`, get the approval, merge.**
5. **Watch the Release run.** Open its Summary. It says either which packages
   published, or `Nothing published`. If you expected a release and see the latter,
   stop and read the failure modes below.
6. **Confirm.** `npm view @velobitsio/ui version`, and check the tag and GitHub
   Release exist.

## Releasing 0.2.0 specifically

**Skip step 1 and 2.** `main` already declares `tokens@0.2.0` and `ui@0.2.0` —
`changeset version` ran on 2026-08-11 in `f2bc22a`, and the changeset is already
consumed. There is nothing left to prepare. Merge `develop → main` and the Release
run publishes both. `icons` stays at `0.1.0` and is skipped; it has an empty diff
against its tag.

The delta being shipped is written up in [RELEASE-0.2.0.md](RELEASE-0.2.0.md).

## Before you release

- **Every user-facing PR needs a changeset**, and the bump type is a permanent
  decision. `npm run changeset` on the feature branch.
- **Don't add one for docs-only work.** `@velobitsio/docs` is `private` and in
  the `.changeset` `ignore` list.
- **CI does not run on pushes to `develop`** — only on PRs and on `main`. Feature
  PRs into `develop` are covered, but anything pushed straight to `develop` is
  unverified until the release PR runs `verify`. Don't push straight to `develop`.
- **Judge "breaking" against the documented surface, not the implementation.**
  0.2.0 removed the `--glass-surface-bg` CSS variable and still shipped as a minor,
  because the supported API is the `.glass-surface` class. That reasoning is
  defensible at 0.x and will not be after 1.0.0.

## Failure modes

| Symptom                                               | Cause                                                                                                                            | Fix                                                                                                                                                  |
| ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| Release run green, Summary says `Nothing published`   | Every version `main` declares is already on npm. Usually means you merged to `main` without dispatching **Prepare release**.     | Dispatch Prepare release on `develop`, merge the resulting PR.                                                                                       |
| Release run shows a `notice` about pending changesets | Changesets landed on `develop` after the prepare and rode along in the merge. Normal — they are next cycle's release.            | Nothing. They version on the next prepare.                                                                                                           |
| Prepare release fails: `No changesets are pending`    | Nothing to release, or you dispatched on the wrong branch.                                                                       | Add a changeset, or check you dispatched on `develop`.                                                                                               |
| Prepare release job skipped entirely                  | Dispatched on a ref other than `develop`.                                                                                        | Re-dispatch with `develop` selected.                                                                                                                 |
| Release job skipped entirely                          | Dispatched on a ref other than `main`. The picker defaults to `develop`.                                                         | Re-dispatch with `main` selected.                                                                                                                    |
| One package published, another failed                 | npm rejected one publish (token scope, registry outage, name collision). Tags and Releases for what succeeded are still created. | Dispatch **Release** on `main` again. `changeset publish` skips what already shipped and retries the rest.                                           |
| Publish rejected: auth                                | `NPM_TOKEN` expired or lost scope on `@velobits`.                                                                                | Reissue an automation token with write on the scope; update the secret.                                                                              |
| Version published but no tag or GitHub Release        | Publish succeeded, then tagging or the Release step failed.                                                                      | Dispatch **Release** on `main`. It tags any version the registry has but the remote lacks, then cuts any Release that is missing. No manual tagging. |

Re-running **Release** is always safe. It publishes only what the registry lacks,
and creates only Releases that don't exist.

## Things that will bite you later

**`ui` will never again be auto-bumped by a sibling change.** The peer ranges are
`>=0.1.0` and `.changeset/config.json` sets
`onlyUpdatePeerDependentsWhenOutOfRange`, so changesets bumps a peer dependent only
when the new sibling version falls _out of range_ — and `>=0.1.0` never does. That
combination is what stopped `ui` being forced to a spurious `1.0.0`, and the same
property means a breaking `tokens` change will not republish `ui` on its own. **If a
`tokens` change affects `ui`, write a changeset for `ui` too.** Nothing will remind
you.

**`prepare-release.yml` pushes directly to `develop`.** If `develop` ever gets a
ruleset like `main`'s, that step starts failing and this whole shape collapses back
into needing a separate version PR.

**Provenance is off.** `.npmrc` sets `provenance=false` because it needs
`permissions: id-token: write` on the release job. npmjs supports attestation, so
this is a deliberate "not yet". Turn the flag and the permission on together, never
separately.

**There is no `RELEASE_TOKEN` and none is needed.** If you ever see that name
referenced, it belongs to the abandoned "push the version commit straight to
`main`" design, which `protect-main` makes impossible without giving CI a
credential that bypasses your branch rules.
