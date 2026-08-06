'use client';

import Link from 'next/link';

import { MoonIcon, SunIcon } from '@velobits-dev/icons';
import { Button, useTheme } from '@velobits-dev/ui';

const NAV = [
  { href: '/', label: 'Overview' },
  { href: '/tokens', label: 'Tokens' },
  { href: '/components', label: 'Components' },
];

export function SiteHeader() {
  const { toggle } = useTheme();

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
        <nav className="flex items-center gap-4 text-sm">
          {NAV.map((item) => (
            <Link key={item.href} href={item.href} className="text-muted-foreground hover:text-fg">
              {item.label}
            </Link>
          ))}
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
