# Setting up per framework

Three things are the same everywhere, and only their location changes:

1. **The CSS entry** imports the token layer, and on the npm path adds the
   `@source` line.
2. **`VelobitsProvider`** wraps the app, once, as high as the tree goes.
3. **The init script** applies the stored theme before first paint, in the
   document head, above everything else.

Most examples below pass `THEME_STORAGE_KEYS.dashboard`, which is the dashboard app's
real key, and the Vite one uses a placeholder. A **new** surface passes its own string
rather than either, and the literal inside its init script has to match it, or the
script reads a key nothing writes and the flash comes back.

Everything below is where those three live, plus the trap specific to that
framework. `npx shadcn@latest init --template <name>` scaffolds a project that is
already correct for steps beyond these: `next`, `vite`, `react-router`, `astro`,
`laravel`, `start`.

Nothing here is Tailwind-version-flexible. Tailwind v4 is required: `@tailwindcss/postcss`
for Next, `@tailwindcss/vite` for everything Vite-based, and `tailwind.config` stays
an empty string in `components.json`.

## Next.js, App Router

```bash
npx shadcn@latest init --template next
npx shadcn@latest add @velobits/velobits --overwrite
```

CSS entry `app/globals.css`. PostCSS plugin `@tailwindcss/postcss`, which `init`
writes. Provider and script both in `app/layout.tsx`:

```tsx
import { THEME_STORAGE_KEYS, themeInitScript } from '@velobitsio/ui/theme';
import { VelobitsProvider } from '@velobitsio/ui';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{ __html: themeInitScript(THEME_STORAGE_KEYS.dashboard) }}
        />
      </head>
      <body>
        <VelobitsProvider storageKey={THEME_STORAGE_KEYS.dashboard}>{children}</VelobitsProvider>
      </body>
    </html>
  );
}
```

`suppressHydrationWarning` is required, not defensive: the script mutates the
element React is about to hydrate.

`@velobitsio/ui/theme` is React-free, which is what lets this Server Component
call `themeInitScript()` during render. Importing it from the barrel instead
pulls a client module into a server file.

`"rsc": true` in `components.json` on this template, so the CLI keeps the
`'use client'` directives our components already carry. Every VeloBits component
that holds state is a client component; that is not something the consumer has to
manage.

**Pages Router** works the same way with `pages/_document.tsx` for the script and
`pages/_app.tsx` for the provider.

**Static export** (`output: 'export'`) is fine. Nothing in the system needs a
server, and the init script runs in the browser.

## Vite, React

```bash
npx shadcn@latest init --template vite
npx shadcn@latest add @velobits/velobits --overwrite
```

CSS entry `src/index.css`, imported by `src/main.tsx`. `vite.config.ts` needs the
Tailwind plugin and the path alias, both of which `init` writes:

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'node:path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': path.resolve(__dirname, './src') } },
});
```

The alias has to exist in **both** `vite.config.ts` and `tsconfig.json` `paths`.
The CLI reads `tsconfig.json` to resolve aliases, Vite resolves them at build
time, and a project with only one of the two installs cleanly and then fails to
build.

The script goes in `index.html`, inline, before the module script. There is no
server render here, so `themeInitScript` cannot be called during render; paste what
it emits instead, which is this:

```html
<script>
  (function () {
    try {
      var m = localStorage.getItem('myapp.theme');
      var d =
        m === 'dark' ||
        ((m === 'system' || !m) && matchMedia('(prefers-color-scheme: dark)').matches);
      var h = document.documentElement;
      h.classList.toggle('dark', d);
      h.style.colorScheme = d ? 'dark' : 'light';
    } catch (e) {}
  })();
</script>
```

`colorScheme` is not decoration: it is what makes form controls, scrollbars and the
canvas behind the page paint dark, and leaving it out gives a dark page with light
native widgets. Keep the storage key identical to the one passed to the provider,
and if the string ever moves, generate the tag from `themeInitScript` in a small
build step rather than editing two places. Provider in `src/main.tsx`:

```tsx
createRoot(document.getElementById('root')!).render(
  <VelobitsProvider storageKey="myapp.theme">
    <App />
  </VelobitsProvider>,
);
```

## React Router 7, framework mode

```bash
npx shadcn@latest init --template react-router
```

CSS entry `app/app.css`, linked from the `links` export in `app/root.tsx`.
Provider and script both go in the `Layout` export, which owns the document:

```tsx
export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <Meta />
        <Links />
        <script
          dangerouslySetInnerHTML={{ __html: themeInitScript(THEME_STORAGE_KEYS.dashboard) }}
        />
      </head>
      <body>
        <VelobitsProvider storageKey={THEME_STORAGE_KEYS.dashboard}>{children}</VelobitsProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}
```

`Layout` and not the default export: on an error the default export is replaced by
the error boundary while `Layout` still renders, so a themed error page needs the
provider here.

SPA mode (`ssr: false`) works too, and then the inline `index.html`-style script
from the Vite section is the equivalent.

## TanStack Start

```bash
npx shadcn@latest init --template start
```

CSS entry `src/styles.css` (or `src/styles/app.css`, depending on the template
version), imported by the root route. Provider and script both in the root route's
document component, `src/routes/__root.tsx`, in the same shape as the React Router
example: script in `<head>`, provider wrapping `children` in `<body>`, and
`suppressHydrationWarning` on `<html>`.

Server functions and loaders are unaffected. Nothing in the token layer or the
components runs on the server beyond `themeInitScript`, which only builds a string.

## Astro

```bash
npx shadcn@latest init --template astro
```

Needs `@astrojs/react`, which the template adds. Two Astro-specific facts change
the shape:

**Each island is its own React root.** A provider in one island does not reach
another, so `VelobitsProvider` cannot wrap the page from an `.astro` file. Either
give every interactive region one island that includes its own provider, or make
the whole interactive area a single island. Rendering two islands that each carry
their own provider is correct and costs one extra tooltip context per island; what
does not work is components in island B relying on a provider mounted in island A,
and the symptom is the usual throw on hover.

```astro
---
import AppIsland from '@/components/AppIsland';
---

<AppIsland client:load />
```

**The script goes in the layout, `is:inline`.** Astro processes and bundles
`<script>` by default, which defers it and reintroduces the flash. `is:inline`
keeps it where it is written:

```astro
<script is:inline>
  /* the same three lines as the Vite example */
</script>
```

Static components rendered without a `client:*` directive are HTML only, which is
fine for anything presentational and wrong for anything that needs state.

## Laravel with Inertia

```bash
npx shadcn@latest init --template laravel
```

CSS entry `resources/css/app.css`, built by `laravel-vite-plugin` with
`@tailwindcss/vite` alongside it. Provider in `resources/js/app.tsx`, inside the
Inertia `setup` callback so it wraps every page:

```tsx
createInertiaApp({
  setup({ el, App, props }) {
    createRoot(el).render(
      <VelobitsProvider storageKey={THEME_STORAGE_KEYS.dashboard}>
        <App {...props} />
      </VelobitsProvider>,
    );
  },
});
```

Script in `resources/views/app.blade.php`, in `<head>` above `@vite`. Blade parses
`@` directives, so keep the inline script free of them, and use `@verbatim` around
it if it ever needs one.

## An existing shadcn project

The components are already there and the bridge is what changes. In order:

1. `npm i @velobitsio/tokens` (npm path) or install the theme item
   (`npx shadcn@latest add @velobits/velobits-theme`).
2. Import the token layer at the **top** of the CSS entry, above any `@theme` block
   of your own.
3. **Delete the generated `:root` and `.dark` oklch blocks** that shadcn's own init
   wrote. They define the same variable names as the bridge and would shadow it
   with a stock grey palette. This is the single most common cause of "the palette
   did not change".
4. Run `npx shadcn@latest add @velobits/cn --overwrite` so the superset `cn` wins.
   Existing shadcn components keep working, ours stop working without it.
5. Wrap the app in `VelobitsProvider`. If a `next-themes` `ThemeProvider` is
   already there, replace it rather than nesting: both write the `dark` class, and
   two writers means the last one wins non-deterministically.

Both vocabularies work afterwards, `bg-background` and `bg-bg` are the same
runtime variable, so existing components need no rewriting.

## Monorepos

`npx shadcn@latest init --template next` has a monorepo variant, and the thing that
matters is that `components.json` lives next to the `tsconfig.json` whose `paths`
resolve its aliases, i.e. in the app or package that will own the files, not at the
repo root. Run the CLI from there, or pass `--cwd apps/web`.

The `@source` line is relative to the **CSS file**, so in a monorepo the depth is
usually `"../../../node_modules/@velobitsio/ui/dist"` rather than `"../"`. Getting
it wrong fails exactly like omitting it: unstyled components, no warning. With
hoisted installs the package resolves at the workspace root, so point the line
there and not at the app's own `node_modules`.

## Module Federation

The npm path is mandatory here, and three packages must be declared
`singleton: true` with a pinned `requiredVersion` in **every** federated config,
the shell and each remote: `@velobitsio/ui`, `@velobitsio/icons` and
`framer-motion`. Otherwise each remote instantiates its own copy of the provider
module, the shell's context is invisible to it, and tooltips inside remotes throw.

Bump the pins and the dependency in lockstep. Overshooting the pin gives
`does not satisfy` warnings first, then a fatal
`does not provide an export named 'default'`, which presents as a blank page and
not as a build error. Restart the dev containers and recreate the router
afterwards.

## Keycloak, and other non-React surfaces

Tokens only, through `@velobitsio/tokens/keycloakify.css`. Do not install
`@velobitsio/ui` there: Keycloakify re-vends component sources through a
`sync-extensions` postinstall hook, so an edit to a file it owns is reverted on the
next `npm install` with nothing to show for it.

That theme toggles `html.dark` rather than `body.dark`, which the `dark` variant
already handles (it matches the element itself as well as its descendants). Pass
`disableDomSync` if a host already owns the class.

## Verifying an install end to end

An install can copy cleanly and still not compile, which is the failure mode worth
checking for:

```bash
npx tsc --noEmit
```

Then look at a page in both themes. The four checks that catch nearly everything:
components are styled (the `@source` line), a tooltip opens on hover (the
provider), a reload does not flash (the init script), and a `⌘` or an icon glyph
renders rather than a box (the fonts).
