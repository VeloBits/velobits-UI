---
'@velobits/tokens': minor
'@velobits/icons': minor
'@velobits/ui': minor
---

Renamed the npm scope from `@velobits-dev/*` to `@velobits/*`.

**This is a breaking change.** The old packages stay on npm at their last
published versions and receive no further releases; nothing auto-forwards.

```diff
-npm i @velobits-dev/tokens @velobits-dev/icons @velobits-dev/ui
+npm i @velobits/tokens @velobits/icons @velobits/ui
```

```diff
-import { Button } from '@velobits-dev/ui';
+import { Button } from '@velobits/ui';
```

```diff
 /* your app's CSS */
-@import '@velobits-dev/tokens/theme.css';
-@source "../node_modules/@velobits-dev/ui/dist";
+@import '@velobits/tokens/theme.css';
+@source "../node_modules/@velobits/ui/dist";
```

The subpath exports are unchanged apart from the scope — `@velobits/ui/form`,
`@velobits/ui/motion`, `@velobits/ui/theme` and the per-component entries all
keep their names.

The scope now also matches the shadcn registry namespace, so `@velobits` is one
string across npm, the CLI (`npx shadcn@latest add @velobits/button`) and the
registry's own `name` — rather than three that merely looked alike.

Minor rather than major because these are pre-1.0; treat it as breaking.
