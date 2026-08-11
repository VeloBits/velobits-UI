'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@velobits-dev/ui';

import { COMPONENT_GROUPS, GUIDE_NAV, componentHref } from '@/lib/docs-nav';
import { registryItemsByName } from '@/lib/generated/registry-data';

/**
 * The docs sidebar.
 *
 * Deliberately NOT glass. It is a full-height column beside scrolling content, so
 * a `backdrop-filter` here would re-sample a region the size of the viewport on
 * every scroll frame — and the header above it is already Tier O. The blur budget
 * for a route is about six live layers; spending one on a static column that
 * never floats over anything is the wrong purchase.
 */
function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  /*
   * `trailingSlash: true` is on for the static export, so `usePathname()` returns
   * `/docs/components/button/` while the hrefs here are written without it.
   * Comparing them raw makes every link inactive — silently, and only in the
   * production build, which is the worst place to find it.
   */
  const normalise = (value: string) => (value.length > 1 ? value.replace(/\/$/, '') : value);
  const current = normalise(pathname) === normalise(href);

  return (
    <Link
      href={href}
      aria-current={current ? 'page' : undefined}
      className={cn(
        // Padding and radius on EVERY item, never only the active one: adding
        // them on activation would reflow the column on every navigation.
        'block rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-micro ease-out',
        current
          ? 'bg-primary-soft text-link'
          : 'text-muted-foreground hover:bg-highlight hover:text-fg',
      )}
    >
      {children}
    </Link>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="px-3 py-1 text-xs font-semibold tracking-wide text-fg uppercase">{title}</p>
      {children}
    </div>
  );
}

export function DocsSidebarNav() {
  return (
    <nav aria-label="Documentation" className="space-y-6 pb-16">
      {GUIDE_NAV.map((group) => (
        <Group key={group.title} title={group.title}>
          {group.items.map((item) => (
            <NavLink key={item.href} href={item.href}>
              {item.title}
            </NavLink>
          ))}
        </Group>
      ))}

      {COMPONENT_GROUPS.map((group) => (
        <Group key={group.title} title={group.title}>
          {group.names.map((name) => (
            <NavLink key={name} href={componentHref(name)}>
              {registryItemsByName[name]?.title ?? name}
            </NavLink>
          ))}
        </Group>
      ))}
    </nav>
  );
}
