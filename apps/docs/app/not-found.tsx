import type { Metadata } from 'next';
import Link from 'next/link';

import { Button, Kbd } from '@velobitsio/ui';
import { ArrowRightIcon, SearchIcon } from '@velobitsio/icons';

/**
 * The 404, and on a static export it is the host's 404 as well.
 *
 * `next build` with `output: 'export'` writes this route to **`out/404.html`**,
 * which is the filename every static host serves for an unmatched path without
 * being configured to: Cloudflare Pages, Netlify, GitHub Pages, and the
 * `try_files $uri $uri/ /404.html` line in the repo README. So this file is not
 * only the in-app not-found boundary , it is what a mistyped URL gets.
 *
 * It renders inside the root layout, so the header, the theme and ⌘K all work
 * here, which is the whole reason to point at search rather than apologise: the
 * reader is one keystroke from the page they actually wanted.
 *
 * ## This is the site's ONLY 404, and that is a property of `output: 'export'`
 *
 * A segment-level `not-found.tsx` under `app/docs/` looks worthwhile , it would
 * keep the sidebar for a bad component slug , and it is unreachable here. Under
 * `output: 'export'`, a dynamic param outside `generateStaticParams()` is a hard
 * error rather than a miss:
 *
 *     Page "/docs/components/[slug]/page" is missing param
 *     "/docs/components/[slug]" in "generateStaticParams()", which is required
 *     with "output: export" config.
 *
 * So the `notFound()` in `[slug]/page.tsx` cannot fire , the params come from the
 * registry, which is also where the lookup that would fail reads from , and every
 * unmatched URL is resolved by the host to this file instead. One 404, no dead
 * boundary that nobody can prove works.
 */
export const metadata: Metadata = {
  title: 'Page not found',
  /*
   * `noindex`, and it matters more than it looks: this same HTML is served for
   * every unmatched path, so without it a crawler that finds one bad link can
   * index an unbounded number of URLs all showing this page.
   */
  robots: { index: false, follow: true },
};

export default function NotFound() {
  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-6 py-24 text-center">
      {/*
       * The status code as text, not as a 96px display number. A 404 page's job
       * is to get the reader somewhere else, and the digits are the one piece of
       * information on it they cannot act on.
       */}
      <p className="font-mono text-sm text-muted-foreground">404</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Page not found</h1>
      <p className="mt-2 leading-7 text-muted-foreground">
        This URL does not exist. It may have been a component that was renamed, or a link written
        before the docs were restructured.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button variant="primary" asChild>
          <Link href="/docs">
            Documentation
            {/* Flipped in RTL, like every other directional glyph on the site. */}
            <ArrowRightIcon className="rtl:rotate-180" />
          </Link>
        </Button>
        <Button variant="secondary" asChild>
          <Link href="/docs/components">Components</Link>
        </Button>
      </div>

      <p className="mt-8 flex flex-wrap items-center justify-center gap-2 text-sm text-muted-foreground">
        <SearchIcon aria-hidden className="size-4" />
        <span>
          Or search every page with <Kbd>⌘</Kbd> <Kbd>K</Kbd>
        </span>
      </p>
    </main>
  );
}
