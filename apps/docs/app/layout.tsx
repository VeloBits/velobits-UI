import type { Metadata } from 'next';

import { THEME_STORAGE_KEYS, themeInitScript } from '@velobits-dev/ui/theme';

import { Providers } from './providers';
import { SiteHeader } from './site-header';

import './globals.css';

export const metadata: Metadata = {
  title: 'VeloBits UI',
  description:
    'The VeloBits design system: tokens, icons and components shared across every VeloBits surface.',
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
       * frame producing an identical picture. Scroll the components page and the
       * grid visibly softens under the header.
       *
       * On `body` rather than a wrapper div so the bloom's `background-attachment:
       * fixed` resolves against the viewport, and so the grid spans the full
       * scrollable height rather than the content box.
       */}
      <body className="page-texture min-h-dvh bg-bg text-fg antialiased">
        <Providers>
          <SiteHeader />
          <main className="mx-auto w-full max-w-page px-6 pb-24">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
