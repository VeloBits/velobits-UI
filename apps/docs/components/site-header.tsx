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

const NAV = [
  { href: '/docs', label: 'Docs' },
  { href: '/docs/components', label: 'Components' },
  { href: '/docs/colors', label: 'Colors' },
  { href: '/docs/icons', label: 'Icons' },
];

/**
 * Exact match for the root, prefix match for everything else — so
 * `/docs/components/button` lights up "Components" while `/docs/colors` does not
 * also light up "Docs".
 *
 * `trailingSlash: true` is on for the static export, so `usePathname()` returns
 * paths with a trailing slash and the hrefs above are written without one.
 * Comparing them raw makes every link inactive — silently, and only in the
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
     * A sticky bar over scrolling content — one of the sanctioned Tier-O glass
     * surfaces, and the only blurred layer on most routes. `z-sticky` sits BELOW
     * `z-dropdown` deliberately, or the header would paint over its own menus.
     */
    <header className="glass sticky top-0 z-sticky border-x-0 border-t-0">
      <div className="mx-auto flex h-14 w-full max-w-screen-2xl items-center gap-3 px-4 sm:px-6">
        {/*
         * The whole sidebar, in a real SidePanel below the lg breakpoint. Same
         * component the AppShell drawer uses — so it buys the focus trap and,
         * the part hand-rolled drawers miss, focus restoration to the trigger.
         */}
        <SidePanel open={navOpen} onOpenChange={setNavOpen}>
          <SidePanelTrigger asChild>
            <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation">
              <MenuIcon />
            </Button>
          </SidePanelTrigger>
          {/* `left`, which the component maps to the inline START edge — it uses
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

        <Link href="/" className="shrink-0 font-semibold tracking-tight">
          VeloBits <span className="text-link">UI</span>
        </Link>

        {/*
         * The current page is signalled THREE ways, and that is not belt-and-
         * braces — it is 1.4.1. A colour shift alone leaves the answer invisible
         * to anyone who cannot separate `--fg` from `--muted-fg`, and invisible
         * to a screen reader entirely.
         *
         *   aria-current="page"   the machine-readable one; the only channel AT has
         *   text-link             muted → the AA-safe blue step (never `--primary`,
         *                         which is 3.90:1 on cream and is a FILL colour)
         *   bg-primary-soft       a filled shape, so colour never carries it alone
         *
         * `bg-primary-soft` + `text-link` is `Badge variant="primary"`, which the
         * SOFT_CHIP_PAIRS suite gates over the page, the panel and the Tier-S
         * composite. This header is Tier O, which that suite does not cover, so
         * it was measured directly: the chip composites to #e4eff7 light /
         * #163243 dark and `--primary-text` on it holds 5.30–5.49:1 across both
         * themes and both plausible backdrops. Comfortably over AA.
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
                    ? 'bg-primary-soft text-link'
                    : 'text-muted-foreground hover:bg-highlight hover:text-fg',
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="ms-auto flex items-center gap-2">
          <SearchCommand />
          <Button variant="ghost" size="sm" asChild className="hidden sm:inline-flex">
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
           * already knows the stored preference — when they disagree React throws
           * #418 and discards the server HTML. Letting the `dark` class decide
           * keeps the markup identical on both sides, and shows the right icon
           * before React has booted.
           *
           * The label is static for the same reason: "Switch to dark theme" would
           * be wrong on the server in exactly the cases the icon was.
           */}
          <Button variant="ghost" size="icon" onClick={toggle} aria-label="Toggle theme">
            <SunIcon className="hidden dark:block" />
            <MoonIcon className="dark:hidden" />
          </Button>
        </div>
      </div>
    </header>
  );
}
