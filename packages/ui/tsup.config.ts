import { defineConfig, type Options } from 'tsup';

const R = '../../registry/velobits';

/**
 * Per-component entry points, so `import { Button } from '@velobits-dev/ui/button'`
 * pulls in Button and nothing else. `size-limit` asserts that rather than
 * assuming it — a barrel-only build would quietly ship all 28 components to a
 * consumer that imported one.
 *
 * The entries live OUTSIDE this package, in `registry/velobits/`, because that
 * directory is also what the shadcn CLI serves. One source, two distributions.
 * The object form is used deliberately: the array form would compute an outbase
 * above this package and scatter output into `dist/ui/`, `dist/lib/` and so on,
 * which the `exports` map would then have to mirror.
 *
 * `test/registry-parity.test.ts` asserts this map, the `exports` map, the barrel
 * and `registry/registry.ts` all list the same components.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ## Two builds, because `'use client'` is per-module
 *
 * esbuild strips directives from the modules it bundles, so the `'use client'`
 * at the top of `button.tsx` does not survive into `dist/button.js`. Next then
 * treats the output as a Server Component and fails on `createContext`, with an
 * error pointing at a bundled chunk rather than at anything you wrote.
 *
 * Bannering the whole package would be wrong: `lib/theme.ts` is deliberately
 * React-free so a Server Component can call `themeInitScript()` during render —
 * `apps/docs/app/layout.tsx` does that to apply the theme before first paint —
 * and a Server Component may not call an arbitrary exported function from a
 * `'use client'` module. Hence two groups.
 *
 * ## Splitting is off
 *
 * Shared chunks are what lost the directive in the first place: a chunk imported
 * by both a client and a server entry can carry only one answer. It also stops
 * the two builds racing to write same-named chunks into one `dist/`. The cost is
 * `cn` being inlined per component rather than shared — a few hundred bytes,
 * held honest by the per-entry `size-limit` budget.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/** Server-safe: no React, no hooks, no context. Callable from an RSC. */
const SERVER_SAFE = {
  cn: `${R}/lib/cn.ts`,
  theme: `${R}/lib/theme.ts`,
};

/** Everything that touches React state, context, or the DOM. */
const CLIENT = {
  index: `${R}/index.ts`,

  'use-theme': `${R}/hooks/use-theme.tsx`,
  'use-media-query': `${R}/hooks/use-media-query.ts`,
  'use-row-selection': `${R}/hooks/use-row-selection.ts`,
  'velobits-provider': `${R}/providers/velobits-provider.tsx`,

  alert: `${R}/ui/alert.tsx`,
  avatar: `${R}/ui/avatar.tsx`,
  badge: `${R}/ui/badge.tsx`,
  button: `${R}/ui/button.tsx`,
  card: `${R}/ui/card.tsx`,
  checkbox: `${R}/ui/checkbox.tsx`,
  field: `${R}/ui/field.tsx`,
  'glass-surface': `${R}/ui/glass-surface.tsx`,
  input: `${R}/ui/input.tsx`,
  kbd: `${R}/ui/kbd.tsx`,
  label: `${R}/ui/label.tsx`,
  'native-select': `${R}/ui/native-select.tsx`,
  separator: `${R}/ui/separator.tsx`,
  skeleton: `${R}/ui/skeleton.tsx`,
  spinner: `${R}/ui/spinner.tsx`,
  switch: `${R}/ui/switch.tsx`,
  textarea: `${R}/ui/textarea.tsx`,
  tooltip: `${R}/ui/tooltip.tsx`,

  /* Tier 2 — overlays. */
  'command-palette': `${R}/ui/command-palette.tsx`,
  dialog: `${R}/ui/dialog.tsx`,
  'dropdown-menu': `${R}/ui/dropdown-menu.tsx`,
  popover: `${R}/ui/popover.tsx`,
  'side-panel': `${R}/ui/side-panel.tsx`,
  toast: `${R}/ui/toast.tsx`,

  /* Tier 3 — composites. */
  accordion: `${R}/ui/accordion.tsx`,
  'app-shell': `${R}/ui/app-shell.tsx`,
  breadcrumb: `${R}/ui/breadcrumb.tsx`,
  'code-block': `${R}/ui/code-block.tsx`,
  'data-table': `${R}/ui/data-table.tsx`,
  'diff-viewer': `${R}/ui/diff-viewer.tsx`,
  'empty-state': `${R}/ui/empty-state.tsx`,
  form: `${R}/ui/form.tsx`,
  pagination: `${R}/ui/pagination.tsx`,
  'segmented-control': `${R}/ui/segmented-control.tsx`,
  'status-chip': `${R}/ui/status-chip.tsx`,
  table: `${R}/ui/table.tsx`,
  tabs: `${R}/ui/tabs.tsx`,
};

const shared: Options = {
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  /*
   * `treeshake` is deliberately OFF, and not for the reason it looks like.
   *
   * tsup implements it as a Rollup pass after esbuild, and Rollup DROPS the
   * `banner` below — so enabling it silently removes every `'use client'`
   * directive and reintroduces the RSC failure this config exists to fix. The
   * output is still dead-code-eliminated by esbuild's own bundling, and
   * `size-limit` holds the per-entry budgets that prove it.
   */
  splitting: false,
  /*
   * Peers stay external so a consumer's copy is the only copy — also what makes
   * the Module Federation singleton arrangement possible at all.
   *
   * `react-hook-form` is here for a sharper version of the same reason. It is an
   * OPTIONAL peer, used only by `form.tsx`; bundling it would give our copy its
   * own module state, so `useFormContext()` inside `FormField` would read a
   * different context from the consumer's `useForm()` and every field would
   * register against nothing. Externalising it is also what makes the barrel
   * exclusion work — see the docblock at the top of `registry/velobits/ui/form.tsx`.
   */
  external: [
    'react',
    'react-dom',
    'framer-motion',
    'react-hook-form',
    '@velobits-dev/icons',
    '@velobits-dev/tokens',
  ],
  /*
   * Both configs run CONCURRENTLY, so neither may clean: whichever starts second
   * would wipe the other's finished output, non-deterministically. `npm run
   * build` does `rm -rf dist` first instead, which also leaves watch mode
   * correctly untouched — a startup wipe there would race apps/docs resolving
   * types from dist/.
   */
  clean: false,
};

export default defineConfig([
  { ...shared, entry: SERVER_SAFE },
  { ...shared, entry: CLIENT, banner: { js: "'use client';" } },
]);
