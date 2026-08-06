'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { MoonIcon, SunIcon } from '@velobits-dev/icons';
import { Button, cn, useTheme } from '@velobits-dev/ui';

const NAV = [
  { href: '/', label: 'Overview' },
  { href: '/tokens', label: 'Tokens' },
  { href: '/components', label: 'Components' },
];

/**
 * Exact match for the root, prefix match for everything else — so a future
 * `/components/button` still lights up "Components", while `/tokens` does not
 * light up "Overview" the way a bare `startsWith('/')` would.
 *
 * `/preview` matches nothing on purpose: it is not in this nav, and a header
 * that highlights nothing is the honest answer for a page that is not listed.
 */
function isCurrent(pathname: string, href: string) {
  return href === '/' ? pathname === '/' : pathname === href || pathname.startsWith(`${href}/`);
}

export function SiteHeader() {
  const { toggle } = useTheme();
  const pathname = usePathname();

  return (
    /*
     * A sticky bar over scrolling content — one of the sanctioned glass
     * surfaces. `z-sticky` deliberately sits BELOW `z-dropdown`, or the header
     * would paint over its own menus.
     */
    <header className="glass sticky top-0 z-sticky mb-8 border-x-0 border-t-0">
      <div className="mx-auto flex h-14 w-full max-w-page items-center gap-6 px-6">
        <Link href="/" className="font-semibold tracking-tight">
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
         * `bg-primary-soft` + `text-link` is not a new pairing — it is exactly
         * `Badge variant="primary"`, which the `SOFT_CHIP_PAIRS` suite gates over
         * the page, the panel and the Tier-S composite. This header is Tier **O**,
         * which that suite does not cover, so it was measured directly: the chip
         * composites to #e4eff7 light / #163243 dark and `--primary-text` on it
         * holds **5.30–5.49:1** across both themes and both plausible backdrops
         * (page and panel scrolling under the blur). Comfortably over AA.
         *
         * The chip reads at 25/255 light and 39/255 dark against the header —
         * visible as a shape. Its ~1.2:1 edge ratio is deliberately not held to
         * 1.4.11's 3:1: nothing here is identified BY the chip. The link is named
         * by its own text and its state is carried by `aria-current`; the fill is
         * redundant emphasis, the same reasoning that makes `--border` contrast-
         * exempt.
         *
         * EVERY item carries the padding and radius; only the fill and the text
         * colour change. Nothing is inserted, moved or resized when the route
         * changes — the same rule that keeps `TabsTrigger` from gaining weight
         * when it activates.
         */}
        <nav className="flex items-center gap-1 text-sm">
          {NAV.map((item) => {
            const current = isCurrent(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={current ? 'page' : undefined}
                className={cn(
                  // `font-medium` on EVERY item, not just the active one:
                  // 400 → 500 changes the glyph advance, so the strip would
                  // reflow on every navigation. `TabsTrigger` does the same.
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
        {/*
         * Both icons are rendered and CSS picks one, rather than
         * `theme === 'dark' ? <SunIcon /> : <MoonIcon />`.
         *
         * That JS branch is a hydration bug, and it is the reference example for
         * why `useTheme` exposes `mounted`. The server has no localStorage, so it
         * renders the light branch, while the client's first render already knows
         * the stored preference — when they disagree React throws #418 and
         * discards the server HTML. Letting the `dark` class decide keeps the
         * markup identical on both sides, and shows the right icon before React
         * has even booted.
         *
         * The label is static for the same reason: "Switch to dark theme" would
         * be wrong on the server in exactly the cases the icon was.
         */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="ms-auto"
          aria-label="Toggle theme"
        >
          <SunIcon className="hidden dark:block" />
          <MoonIcon className="dark:hidden" />
        </Button>
      </div>
    </header>
  );
}
