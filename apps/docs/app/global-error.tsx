'use client';

import { THEME_STORAGE_KEYS, readStoredMode, resolveTheme } from '@velobitsio/ui/theme';

import './globals.css';

/**
 * The last boundary: the root layout itself threw, so nothing it provides exists.
 *
 * ## Why this file duplicates the shell instead of importing it
 *
 * `global-error` REPLACES `app/layout.tsx`, which is why it has to render its own
 * `<html>` and `<body>`, and why the stylesheet is imported here as well , the
 * layout's import went down with the layout. Everything the layout mounts is gone
 * with it: no `VelobitsProvider`, so no theme context and **no `TooltipProvider`**,
 * which is why nothing on this page may be a component that opens a tooltip. It
 * would throw inside the boundary that exists to catch throwing.
 *
 * That constraint is the whole design of this page: plain elements, one link, no
 * state. `Button` would be safe (it needs no provider) and is still not used ,
 * this is the file that has to work when the reason the page broke is the package
 * the button comes from.
 *
 * ## The theme, without the init script
 *
 * The blocking script in the layout is what normally puts `dark` on `<html>`, and
 * it did not run, or ran and then the layout threw. So the class is derived here
 * from the same stored value, using the React-free `@velobitsio/ui/theme` subpath
 * that the script itself is built from. Guarded for the server because a wrong
 * answer here is a light flash, and a throw is a blank page.
 */
function storedTheme(): 'light' | 'dark' {
  if (typeof window === 'undefined') return 'light';
  try {
    return resolveTheme(readStoredMode(THEME_STORAGE_KEYS.dashboard));
  } catch {
    return 'light';
  }
}

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const detail = [error.digest && `digest: ${error.digest}`, error.message]
    .filter(Boolean)
    .join('\n');

  return (
    <html lang="en" className={storedTheme() === 'dark' ? 'dark' : undefined}>
      {/*
       * `bg-bg text-fg` restated here for the same reason as the stylesheet
       * import: those classes live on the `<body>` in `app/layout.tsx`, and this
       * element is not that one.
       */}
      <body className="min-h-dvh bg-bg text-fg antialiased">
        <main className="mx-auto w-full max-w-2xl px-6 py-24 text-center">
          <p className="font-mono text-sm text-danger">Error</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">This page could not load</h1>
          <p className="mt-2 leading-7 text-muted-foreground">
            The documentation shell failed to start, so the header and navigation are missing rather
            than broken. Reloading usually resolves it.
          </p>

          {/*
           * `reset()` is intentionally not offered. It re-renders the root layout,
           * i.e. the thing that just threw, so on the failure this file exists for
           * it produces the same page again while looking like a recovery. A full
           * document load is the only action that can actually change the outcome.
           *
           * A plain anchor, not a `<Link>`: the router lives in the tree that
           * failed, and a client-side navigation would re-enter it.
           */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href="/"
              className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-on-primary control-raised hover:bg-primary-hover"
            >
              Reload the site
            </a>
            <a
              href="/docs"
              className="rounded-md border border-field-border bg-panel px-4 py-2 text-sm font-medium text-fg control-raised hover:bg-highlight"
            >
              Documentation
            </a>
          </div>

          {detail && (
            <pre
              // Focusable because it scrolls, exactly as `CodeBlock` is. Hand-rolled
              // for the reason in the docblock: this page assumes nothing renders.
              tabIndex={0}
              // `scrollbar-on-dark` for the same reason `CodeBlock`'s terminal
              // variant carries it: `--code` is dark in both themes, so the
              // default thumb escalation inverts here in light mode.
              className="scrollbar-on-dark mt-8 overflow-auto rounded-md bg-code p-3 text-start font-mono text-xs break-all whitespace-pre-wrap text-on-code"
            >
              {detail}
            </pre>
          )}
        </main>
      </body>
    </html>
  );
}
