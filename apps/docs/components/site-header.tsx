'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import {
  Button,
  SidePanel,
  SidePanelContent,
  SidePanelHeader,
  SidePanelTitle,
  SidePanelTrigger,
  cn,
  useTheme,
} from '@velobitsio/ui';
import { MenuIcon, MoonIcon, SunIcon } from '@velobitsio/icons';

import { SITE } from '@/lib/site';

import { DocsSidebarNav } from './docs-sidebar';
import { SearchCommand } from './search-command';

/**
 * `Button variant="ghost"` is `text-fg hover:bg-highlight`. Both are theme tokens,
 * and the header is the one surface in this app that does NOT follow the theme ,
 * `text-fg` on `bg-chrome` is 1.06:1 in light mode, and `hover:bg-highlight` is
 * charcoal at alpha 0.05, which darkens an already-dark bar.
 *
 * Applied per control instead of becoming a `chrome` Button variant on purpose:
 * chrome is a property of the container a button happens to sit in, not of the
 * button, so a variant would let it be selected anywhere and be wrong everywhere
 * else.
 */
const CHROME_GHOST = 'text-chrome-fg hover:bg-chrome-highlight hover:text-chrome-fg';

const NAV = [
  { href: '/docs', label: 'Docs' },
  { href: '/docs/components', label: 'Components' },
  { href: '/docs/colors', label: 'Colors' },
  { href: '/docs/icons', label: 'Icons' },
];

/**
 * Exact match for the root, prefix match for everything else , so
 * `/docs/components/button` lights up "Components" while `/docs/colors` does not
 * also light up "Docs".
 *
 * `trailingSlash: true` is on for the static export, so `usePathname()` returns
 * paths with a trailing slash and the hrefs above are written without one.
 * Comparing them raw makes every link inactive , silently, and only in the
 * production build.
 */
function isCurrent(pathname: string, href: string) {
  const trim = (value: string) => (value.length > 1 ? value.replace(/\/$/, '') : value);
  const path = trim(pathname);
  const target = trim(href);

  if (target === '/docs') {
    // "Docs" owns the guide pages, but not the three sections with their own tab.
    return (
      path === '/docs' ||
      (path.startsWith('/docs/') &&
        !NAV.some(
          (item) =>
            item.href !== '/docs' &&
            (path === trim(item.href) || path.startsWith(`${trim(item.href)}/`)),
        ))
    );
  }
  return path === target || path.startsWith(`${target}/`);
}

export function SiteHeader() {
  const { toggle } = useTheme();
  const pathname = usePathname();
  const [navOpen, setNavOpen] = useState(false);

  return (
    /*
     * The app-chrome tier , PLUM in light, BLACK in dark. This was Tier-O glass,
     * which in light mode meant a near-white bar on a near-white page: the row
     * carrying the product name and the primary nav read as part of the document
     * rather than as the frame around it.
     *
     * `dark:bg-black` used to live on this element, because the token was plum in
     * both themes and a plum strip on a near-black page is the only chromatic mass
     * on screen. That override is GONE , `--chrome` carries it now, so the docs
     * header and `AppShellHeader` cannot drift apart again. If this bar ever needs
     * a `dark:` variant, the token is wrong, not the header.
     *
     * Everything inside therefore uses the `chrome*` foregrounds, NOT `fg` /
     * `muted-foreground` / `link`. On plum those measure 1.23:1, 1.84:1 and
     * 1.87:1 , the bar is dark in BOTH themes while those tokens flip with the
     * page, so light mode is where they fail. See `SemanticTokens.chrome`.
     *
     * `z-sticky` sits BELOW `z-dropdown` deliberately, or the header would paint
     * over its own menus.
     */
    <header className="sticky top-0 z-sticky border-b border-chrome-border bg-chrome text-chrome-fg">
      <div className="mx-auto flex h-14 w-full max-w-screen-2xl items-center gap-3 px-4 sm:px-6">
        {/*
         * The whole sidebar, in a real SidePanel below the lg breakpoint. Same
         * component the AppShell drawer uses , so it buys the focus trap and,
         * the part hand-rolled drawers miss, focus restoration to the trigger.
         */}
        <SidePanel open={navOpen} onOpenChange={setNavOpen}>
          <SidePanelTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              /* `ghost` is `text-fg hover:bg-highlight` , two theme tokens on a
                 surface that does not follow the theme. Overridden per control
                 rather than by adding a Button variant: chrome is a property of
                 the container, not of the button. */
              className={cn('lg:hidden', CHROME_GHOST)}
              aria-label="Open navigation"
            >
              <MenuIcon />
            </Button>
          </SidePanelTrigger>
          {/* `left`, which the component maps to the inline START edge; it uses
              logical properties, so this mirrors correctly under RTL. */}
          <SidePanelContent side="left">
            <SidePanelHeader>
              <SidePanelTitle>Documentation</SidePanelTitle>
            </SidePanelHeader>
            <div
              className="overflow-y-auto px-2"
              // Closing on navigation is the caller's job: Next does a client
              // transition, so nothing unmounts this panel on its own and it
              // would stay open over the page the reader just asked for.
              onClick={(event) => {
                if ((event.target as HTMLElement).closest('a')) setNavOpen(false);
              }}
            >
              <DocsSidebarNav />
            </div>
          </SidePanelContent>
        </SidePanel>

        {/* `text-chrome-accent` , lime, 8.85:1 on plum. Not `text-link`, which is
            the light-theme blue step and measures 1.87:1 on this surface. */}
        <Link href="/" className="shrink-0 font-semibold tracking-tight">
          VeloBits <span className="text-chrome-accent">UI</span>
        </Link>

        {/*
         * The current page is signalled THREE ways, and that is not belt-and-
         * braces , it is 1.4.1. A colour shift alone leaves the answer invisible
         * to anyone who cannot separate two greys, and invisible to a screen
         * reader entirely.
         *
         *   aria-current="page"     the machine-readable one; the only channel AT has
         *   text-chrome-accent      LIME , the brand accent, 8.85:1 on plum
         *   bg-chrome-accent-soft   a filled shape, so colour never carries it alone
         *
         * Every colour here is a `chrome*` token, and none of them is what the
         * obvious version of this component reaches for:
         *
         *   text-link              the LIGHT-theme blue step , 1.87:1 on plum
         *   text-muted-foreground  the light-theme grey      , 1.84:1 on plum
         *   hover:bg-highlight     charcoal at alpha 0.05, i.e. DARKENS an already
         *                          dark bar , invisible
         *
         * All three pass every gate they belong to, and all three are wrong here.
         * That is the reason chrome is a token tier rather than one class on the
         * header element.
         *
         * Measured for the active item on the LIGHT bar, which is the worse of the
         * two: the lime wash composites to #6B493F over plum and `--chrome-accent`
         * on it holds 6.07:1. Over the black bar every one of these only improves ,
         * the foregrounds are theme-invariant and the surface got darker. The
         * hovered inactive item composites to #663A50, where the muted label is
         * 5.17:1 , so the label promotion in
         * the hover rule below is a design choice, not a requirement.
         *
         * EVERY item carries the padding, radius and font-weight; only the fill
         * and the text colour change. Nothing is inserted, moved or resized when
         * the route changes.
         */}
        <nav aria-label="Main" className="hidden items-center gap-1 text-sm md:flex">
          {NAV.map((item) => {
            const current = isCurrent(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={current ? 'page' : undefined}
                className={cn(
                  'rounded-md px-3 py-1.5 font-medium transition-colors duration-micro ease-out',
                  current
                    ? 'bg-chrome-accent-soft text-chrome-accent'
                    : 'text-chrome-muted-fg hover:bg-chrome-highlight hover:text-chrome-fg',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <SearchCommand />
          <Button
            variant="ghost"
            size="sm"
            asChild
            className={cn('hidden sm:inline-flex', CHROME_GHOST)}
          >
            <a href={SITE.repo} target="_blank" rel="noreferrer noopener">
              GitHub
            </a>
          </Button>
          {/*
           * Both icons are rendered and CSS picks one, rather than
           * `theme === 'dark' ? <SunIcon /> : <MoonIcon />`.
           *
           * That JS branch is a hydration bug, and it is the reference example
           * for why `useTheme` exposes `mounted`. The server has no localStorage,
           * so it renders the light branch while the client's first render
           * already knows the stored preference , when they disagree React throws
           * #418 and discards the server HTML. Letting the `dark` class decide
           * keeps the markup identical on both sides, and shows the right icon
           * before React has booted.
           *
           * The label is static for the same reason: "Switch to dark theme" would
           * be wrong on the server in exactly the cases the icon was.
           */}
          <Button
            variant="ghost"
            size="icon"
            onClick={toggle}
            className={CHROME_GHOST}
            aria-label="Toggle theme"
          >
            <SunIcon className="hidden dark:block" />
            <MoonIcon className="dark:hidden" />
          </Button>
        </div>
      </div>
    </header>
  );
}
