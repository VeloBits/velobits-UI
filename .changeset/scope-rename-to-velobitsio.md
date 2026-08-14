---
'@velobitsio/tokens': minor
'@velobitsio/icons': minor
'@velobitsio/ui': minor
---

Renamed the npm scope from `@velobits-dev/*` to `@velobitsio/*`.

**This is a breaking change, and there is no upgrade path from the old packages.**
The `@velobits-dev/*` packages were removed from npm entirely — they are not
deprecated-but-installable, they are gone, and nothing forwards to the new names.
Pin to the new scope explicitly.

```diff
-npm i @velobits-dev/tokens @velobits-dev/icons @velobits-dev/ui
+npm i @velobitsio/tokens @velobitsio/icons @velobitsio/ui
```

```diff
-import { Button } from '@velobits-dev/ui';
+import { Button } from '@velobitsio/ui';
```

```diff
 /* your app's CSS */
-@import '@velobits-dev/tokens/theme.css';
-@source "../node_modules/@velobits-dev/ui/dist";
+@import '@velobitsio/tokens/theme.css';
+@source "../node_modules/@velobitsio/ui/dist";
```

The subpath exports are unchanged apart from the scope — `@velobitsio/ui/form`,
`@velobitsio/ui/motion`, `@velobitsio/ui/theme` and the per-component entries
all keep their names.

### The shadcn registry namespace does NOT change

It stays `@velobits`, and nothing you do with the CLI changes:

```bash
npx shadcn@latest add @velobits/button    # unchanged
```

These are two different namespaces that merely look alike. The CLI resolves
`@velobits` from a registry URL in your `components.json`, never from npm, so the
npm scope and the registry namespace are independent — changing one does not
touch the other.

Minor rather than major because these are pre-1.0; treat it as breaking.
