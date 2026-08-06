# @velobits-dev/icons

## 0.1.0

Initial release.

89 hand-drawn stroke icons on a 24×24 grid, tuned to read at 13–18px.

- **Merged from two diverged sets.** The VeloBits apps had each grown their own
  icons; this is the union, and every name that existed in either set is
  preserved, so adopting the package is a rename-free change.
- **`createIcon`** is exported for building one-off icons on the same geometry,
  along with the `Icon` and `IconProps` types.
- **Tree-shakes without per-icon entry points.** `sideEffects: false` and every
  export is a plain function, so a bundler drops what you do not reference. A
  `size-limit` budget asserts it in CI — roughly 233 B for a single icon —
  rather than taking it on trust.

### Known

The package docblock says 88 icons; the true count is 89.
