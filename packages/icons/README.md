# @velobitsdevs/icons

The VeloBits icon set — 88 hand-drawn stroke icons on a 24×24 grid, tuned to
read at 13–18px, which is where they actually get used.

Merged from the two sets that had independently diverged across the VeloBits
apps. Every name that existed in either set is preserved.

## Install

```bash
npm install @velobitsdevs/icons
```

React 19 or later is a peer dependency.

## Use

```tsx
import { FlagIcon } from '@velobitsdevs/icons';

<FlagIcon size={16} />;
```

Every icon takes `size` plus the usual SVG props, and inherits `currentColor`.

Build your own on the same geometry with `createIcon`:

```tsx
import { createIcon } from '@velobitsdevs/icons';

export const MyIcon = createIcon('MyIcon', <path d="M4 12h16" />);
```

The `Icon` and `IconProps` types are exported alongside it.

## Tree-shaking

There are no per-icon entry points and none are needed. The package is
`sideEffects: false` and every export is a plain function, so a bundler drops
what you do not reference. That is asserted by a `size-limit` budget in CI
rather than assumed — a single icon costs about 233 B.

## Licence

Proprietary. See [LICENSE](./LICENSE). Published publicly for VeloBits' own
build pipelines; this is not an offer of licence.
