'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { cn } from '@velobitsio/ui';

import { COMPONENT_GROUPS, GUIDE_NAV, NEW_COMPONENTS, componentHref } from '@/lib/docs-nav';
import { registryItemsByName } from '@/lib/generated/registry-data';

/**
 * The docs sidebar.
 *
 * Deliberately NOT glass. It is a full-height column beside scrolling content, so
 * a `backdrop-filter` here would re-sample a region the size of the viewport on
 * every scroll frame , and the header above it is already Tier O. The blur budget
 * for a route is about six live layers; spending one on a static column that
 * never floats over anything is the wrong purchase.
 */
function NavLink({
  href,
  isNew,
  children,
}: {
  href: string;
  isNew?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  /*
   * `trailingSlash: true` is on for the static export, so `usePathname()` returns
   * `/docs/components/button/` while the hrefs here are written without it.
   * Comparing them raw makes every link inactive , silently, and only in the
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
        'rounded-md px-3 py-1.5 text-sm font-medium transition-colors duration-micro ease-out',
        // `flex` rather than `block` so the dot sits on the baseline row with the
        // label. Items without a dot are unaffected: a flex container with one
        // text child lays out identically.
        'flex items-center gap-2',
        current
          ? 'bg-primary-soft text-link'
          : 'text-muted-foreground hover:bg-highlight hover:text-fg',
      )}
    >
      {children}
      {isNew && <NewDot />}
    </Link>
  );
}

/**
 * "This is new", as a dot rather than a word.
 *
 * ## Why `bg-accent-text` and not `bg-brand`
 *
 * Lime is asymmetric: as a fill it takes charcoal on top, and as a lone graphical
 * mark on the cream page it measures 1.31:1, which is to say invisible.
 * `--accent-text` is the token that exists for this , lime in dark, plum in light ,
 * so the dot carries in both themes rather than one.
 *
 * ## Why there is a word for screen readers
 *
 * A pulsing dot means "new" by convention and colour, which on its own is 1.4.1.
 * The visually-hidden text is what makes the link announce "Agent skill, new"
 * instead of leaving the mark as decoration nobody hears, and the dot is
 * `aria-hidden` so it is announced once rather than twice.
 *
 * The pulse needs no reduced-motion handling here: the token layer clamps every
 * animation globally under `prefers-reduced-motion`, and what is left is a static
 * dot, which still carries the meaning.
 *
 * ⚠️ It is driven by `isNew` in `lib/docs-nav.ts`, and that flag is meant to be
 * deleted a release or two after the page lands. A permanent badge is noise.
 */
function NewDot() {
  return (
    <>
      <span aria-hidden className="relative flex size-1.5 shrink-0">
        <span className="absolute inline-flex size-full animate-ping rounded-pill bg-accent-text opacity-75" />
        <span className="relative inline-flex size-1.5 rounded-pill bg-accent-text" />
      </span>
      <span className="sr-only">, new</span>
    </>
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
            <NavLink key={item.href} href={item.href} isNew={item.isNew}>
              {item.title}
            </NavLink>
          ))}
        </Group>
      ))}

      {COMPONENT_GROUPS.map((group) => (
        <Group key={group.title} title={group.title}>
          {group.names.map((name) => (
            <NavLink key={name} href={componentHref(name)} isNew={NEW_COMPONENTS.has(name)}>
              {registryItemsByName[name]?.title ?? name}
            </NavLink>
          ))}
        </Group>
      ))}
    </nav>
  );
}
