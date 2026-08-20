import type { Metadata } from 'next';

import { THEME_STORAGE_KEYS, themeInitScript } from '@velobitsio/ui/theme';

import { SiteHeader } from '@/components/site-header';
import { SITE } from '@/lib/site';

import { Providers } from './providers';

import './globals.css';

export const metadata: Metadata = {
  /*
   * A template rather than a literal, now that there are ~60 pages: every one of
   * them sets a bare title and the suffix is appended here, so a component page
   * reads "Button · VeloBits UI" in a tab strip and a bookmark list.
   */
  title: { default: SITE.name, template: `%s · ${SITE.name}` },
  description: SITE.description,
  metadataBase: new URL(SITE.url),
  /*
   * Declared explicitly against `public/icon.svg` rather than relying on the
   * `app/icon.svg` file convention, which built as a route but was not served by
   * `next start` under Turbopack. An unresolved favicon is a console 404 on every
   * page of a design-system site, which is a poor advertisement for one.
   */
  icons: { icon: '/icon.svg' },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/*
          Runs before first paint so the correct theme is applied before React
          boots. `suppressHydrationWarning` above is required precisely because
          this script mutates the html element that React is about to hydrate.
        */}
        <script
          dangerouslySetInnerHTML={{ __html: themeInitScript(THEME_STORAGE_KEYS.dashboard) }}
        />
      </head>
      {/*
       * `page-texture` is opt-in, and this is the reference consumer opting in.
       *
       * It is also what makes the blur tier mean anything on this site: the
       * SiteHeader is tier-O glass with a real `backdrop-filter`, and until there
       * was something behind it to smear, that blur was a backdrop snapshot per
       * frame producing an identical picture. Scroll any component page and the
       * content visibly softens under the header.
       *
       * On `body` rather than a wrapper div so the bloom's `background-attachment:
       * fixed` resolves against the viewport, and so the grid spans the full
       * scrollable height rather than the content box.
       */}
      <body className="page-texture min-h-dvh bg-bg text-fg antialiased">
        <Providers>
          {/*
           * The skip link, which is the most-skipped WCAG requirement in a docs
           * site: the sidebar is ~60 links, and without this a keyboard user tabs
           * through every one of them on every page before reaching the prose.
           * Visible only on focus, and first in the tab order.
           */}
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:absolute focus:inset-s-4 focus:top-4 focus:z-modal focus:rounded-md focus:bg-panel focus:px-4 focus:py-2 focus:text-fg focus:outline-2 focus:outline-offset-2 focus:outline-primary"
          >
            Skip to content
          </a>
          <SiteHeader />
          {children}
        </Providers>
      </body>
    </html>
  );
}
