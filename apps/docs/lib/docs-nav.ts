/**
 * The sidebar. Guide pages are listed here because they are prose and there is
 * nothing to derive them from; component pages are **grouped** here but not
 * *enumerated* here, which is a distinction worth keeping straight.
 *
 * ## The one hand-maintained list, and why it cannot go stale silently
 *
 * `/docs/components/[slug]` builds its pages from `registry/registry.ts`, so a
 * new registry item gets a documentation page whether or not anyone touches this
 * file. What this file decides is only which heading it appears under.
 *
 * The tiers exist only as section comments inside `registry/registry.ts` — one
 * flat `ui` array with `/* ── Tier 2 ── *\/` between the groups — so there is no
 * exported structure to read them from. Rather than reach into the source with a
 * regex, membership is declared here, and `scripts/build-docs-data.ts` fails the
 * build listing any registry item this file does not place. So the failure mode
 * is a build error naming the missing component, not a page quietly absent from
 * the sidebar.
 */

export interface NavItem {
  title: string;
  href: string;
  /** Shown on the components index grid. Falls back to the registry description. */
  description?: string;
}

export interface NavGroup {
  title: string;
  items: NavItem[];
}

/** Prose pages, in sidebar order. */
export const GUIDE_NAV: NavGroup[] = [
  {
    title: 'Get started',
    items: [
      { title: 'Introduction', href: '/docs' },
      { title: 'Installation', href: '/docs/installation' },
      { title: 'components.json', href: '/docs/components-json' },
      { title: 'Registry', href: '/docs/registry' },
      { title: 'CLI', href: '/docs/cli' },
    ],
  },
  {
    title: 'Design system',
    items: [
      { title: 'Theming', href: '/docs/theming' },
      { title: 'Dark mode', href: '/docs/dark-mode' },
      { title: 'Colors', href: '/docs/colors' },
      { title: 'Icons', href: '/docs/icons' },
    ],
  },
  {
    title: 'About',
    items: [{ title: 'Changelog', href: '/docs/changelog' }],
  },
];

export interface ComponentGroup {
  title: string;
  /** One line under the heading on the components index. */
  note: string;
  /** Registry item names, in the order they should appear. */
  names: string[];
}

/**
 * Component pages, grouped by tier — the same three tiers the system is designed
 * in, which is also the order to read them in.
 */
export const COMPONENT_GROUPS: ComponentGroup[] = [
  {
    title: 'Getting started',
    note: 'The token layer and the provider stack. Install these first — every component below assumes both.',
    names: ['velobits', 'velobits-theme', 'velobits-provider'],
  },
  {
    title: 'Primitives',
    note: 'Tier 1. One job each, mostly stateless. Ordered material-first: GlassSurface, Card and Alert are what the system looks like; the controls follow.',
    names: [
      'glass-surface',
      'card',
      'alert',
      'button',
      'badge',
      'input',
      'textarea',
      'native-select',
      'checkbox',
      'switch',
      'label',
      'field',
      'avatar',
      'kbd',
      'separator',
      'skeleton',
      'spinner',
      'tooltip',
    ],
  },
  {
    title: 'Overlays',
    note: 'Tier 2. Each floats above the page on Tier-O glass and manages focus. Every one opens from a real trigger — a still of an overlay proves nothing about focus, Escape or the material.',
    names: ['dialog', 'side-panel', 'popover', 'dropdown-menu', 'toast', 'command-palette'],
  },
  {
    title: 'Composites',
    note: 'Tier 3. Assembled from the tiers below, each encoding one opinionated workflow.',
    names: [
      'app-shell',
      'data-table',
      'table',
      'form',
      'accordion',
      'tabs',
      'segmented-control',
      'status-chip',
      'empty-state',
      'pagination',
      'breadcrumb',
      'code-block',
      'diff-viewer',
      'motion',
    ],
  },
  {
    title: 'Hooks and utilities',
    note: 'The React-free foundation. `cn` and `theme` are callable from a Server Component; the hooks are not.',
    names: ['cn', 'theme', 'use-theme', 'use-media-query', 'use-row-selection'],
  },
];

/** Every registry item name this file places, in sidebar order. */
export const GROUPED_COMPONENT_NAMES: string[] = COMPONENT_GROUPS.flatMap((g) => g.names);

export function componentHref(name: string): string {
  return `/docs/components/${name}`;
}

/**
 * Previous/next across the whole component sidebar, for the pager at the foot of
 * each page. Returns `null` at each end rather than wrapping — a "next" link that
 * silently returns you to the top of the list is worse than no link.
 */
export function componentPager(name: string): {
  prev: { name: string; href: string } | null;
  next: { name: string; href: string } | null;
} {
  const index = GROUPED_COMPONENT_NAMES.indexOf(name);
  if (index === -1) return { prev: null, next: null };

  const prevName = GROUPED_COMPONENT_NAMES[index - 1];
  const nextName = GROUPED_COMPONENT_NAMES[index + 1];
  return {
    prev: prevName ? { name: prevName, href: componentHref(prevName) } : null,
    next: nextName ? { name: nextName, href: componentHref(nextName) } : null,
  };
}
