---
'@velobitsdevs/tokens': minor
'@velobitsdevs/icons': minor
'@velobitsdevs/ui': minor
---

Renamed the npm scope from `@velobits-dev/*` to `@velobitsdevs/*`.

**This is a breaking change, and there is no upgrade path from the old packages.**
The `@velobits-dev/*` packages were removed from npm entirely — they are not
deprecated-but-installable, they are gone, and nothing forwards to the new names.
Pin to the new scope explicitly.

```diff
-npm i @velobits-dev/tokens @velobits-dev/icons @velobits-dev/ui
+npm i @velobitsdevs/tokens @velobitsdevs/icons @velobitsdevs/ui
```

```diff
-import { Button } from '@velobits-dev/ui';
+import { Button } from '@velobitsdevs/ui';
```

```diff
 /* your app's CSS */
-@import '@velobits-dev/tokens/theme.css';
-@source "../node_modules/@velobits-dev/ui/dist";
+@import '@velobitsdevs/tokens/theme.css';
+@source "../node_modules/@velobitsdevs/ui/dist";
```

The subpath exports are unchanged apart from the scope — `@velobitsdevs/ui/form`,
`@velobitsdevs/ui/motion`, `@velobitsdevs/ui/theme` and the per-component entries
all keep their names.

### The shadcn registry namespace does NOT change

It stays `@velobits`, and nothing you do with the CLI changes:

```bash
npx shadcn@latest add @velobits/button    # unchanged
```

These are two different namespaces that merely look alike. The CLI resolves
`@velobits` from a registry URL in your `components.json`, never from npm, so the
npm scope and the registry namespace are free to differ — and here they must.
`@velobits` on npm is held by an unrelated user account, and because npm shares
one namespace between users and orgs, that name cannot be obtained as an org
either. `@velobitsdevs` is the org we own.

Minor rather than major because these are pre-1.0; treat it as breaking.
