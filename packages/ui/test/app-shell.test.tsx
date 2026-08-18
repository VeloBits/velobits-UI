import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  AppShell,
  AppShellHeader,
  AppShellSidebarTrigger,
  useAppShell,
} from '../../../registry/velobits/ui/app-shell';
import { auditElement } from './axe';

/**
 * happy-dom's `matchMedia` always reports `matches: false` and never fires, so
 * the viewport is controlled explicitly. That matters here: the whole point of
 * the resize behaviour is what happens when the query flips, which a static stub
 * can never exercise.
 */
let listeners: ((e: MediaQueryListEvent) => void)[] = [];
let desktop = false;

function setViewport(isDesktop: boolean) {
  desktop = isDesktop;
  act(() => {
    for (const l of listeners) l({ matches: isDesktop } as MediaQueryListEvent);
  });
}

beforeEach(() => {
  listeners = [];
  desktop = false;
  vi.stubGlobal(
    'matchMedia',
    vi.fn((query: string) => ({
      matches: desktop,
      media: query,
      addEventListener: (_: string, l: (e: MediaQueryListEvent) => void) => listeners.push(l),
      removeEventListener: (_: string, l: (e: MediaQueryListEvent) => void) => {
        listeners = listeners.filter((x) => x !== l);
      },
    })),
  );
});

afterEach(() => vi.unstubAllGlobals());

const NAV = (
  <ul>
    <li>
      <a href="/flags">Flags</a>
    </li>
    <li>
      <a href="/audit">Audit</a>
    </li>
  </ul>
);

function Fixture({ children, ...props }: Partial<React.ComponentProps<typeof AppShell>> = {}) {
  return (
    <AppShell
      header={
        <AppShellHeader>
          <AppShellSidebarTrigger />
          <span>Acme</span>
        </AppShellHeader>
      }
      sidebar={NAV}
      {...props}
    >
      {children ?? <h1>Flags</h1>}
    </AppShell>
  );
}

describe('AppShell, the skip link', () => {
  it('is the first element in the DOM', () => {
    /** A skip link that is not first is not a skip link. */
    const { container } = render(<Fixture />);
    const shell = container.querySelector('[data-slot="app-shell"]')!;
    expect(shell.firstElementChild!.getAttribute('data-slot')).toBe('app-shell-skip-link');
  });

  it('points at the main landmark', () => {
    render(<Fixture />);
    const link = screen.getByRole('link', { name: 'Skip to content' });
    expect(link.getAttribute('href')).toBe('#app-shell-main');
    expect(screen.getByRole('main').id).toBe('app-shell-main');
  });

  it('becomes visible on focus rather than staying hidden forever', () => {
    /**
     * The classic broken implementation is `left: -9999px` with no focus rule: it
     * exists, it is announced, and a sighted keyboard user cannot see where their
     * focus went.
     */
    render(<Fixture />);
    const cls = screen.getByRole('link', { name: 'Skip to content' }).className;
    expect(cls).toContain('sr-only');
    expect(cls).toContain('focus:not-sr-only');
  });

  it('gives main a negative tabindex, so the jump moves FOCUS and not just scroll', () => {
    /**
     * Without it the browser scrolls to the target and leaves focus on the link,
     * so the very next Tab goes straight back into the navigation the user asked
     * to skip , the link appears to do nothing.
     */
    render(<Fixture />);
    expect(screen.getByRole('main').getAttribute('tabindex')).toBe('-1');
  });

  it('honours a custom main id in both halves at once', () => {
    render(<Fixture mainId="page" />);
    expect(screen.getByRole('link', { name: 'Skip to content' }).getAttribute('href')).toBe(
      '#page',
    );
    expect(screen.getByRole('main').id).toBe('page');
  });
});

describe('AppShell, one nav definition and two presentations', () => {
  it('exposes exactly one navigation landmark while the drawer is closed', () => {
    render(<Fixture />);
    const nav = screen.getByRole('navigation', { name: 'Main' });
    expect(within(nav).getByRole('link', { name: 'Flags' })).toBeTruthy();
  });

  it('renders the same sidebar node in the drawer', async () => {
    render(<Fixture />);
    await userEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    const drawer = await screen.findByRole('dialog', { name: 'Main' });
    expect(within(drawer).getByRole('link', { name: 'Audit' })).toBeTruthy();
  });

  it('renders no rail and no drawer at all when there is no sidebar', () => {
    const { container } = render(<Fixture sidebar={undefined} />);
    expect(container.querySelector('[data-slot="app-shell-rail"]')).toBeNull();
    expect(screen.queryByRole('navigation')).toBeNull();
  });

  it('names both the landmark and the drawer from one prop', async () => {
    render(<Fixture sidebarLabel="Project" />);
    expect(screen.getByRole('navigation', { name: 'Project' })).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    expect(await screen.findByRole('dialog', { name: 'Project' })).toBeTruthy();
  });
});

describe('AppShell, the drawer is a real modal', () => {
  it('traps focus and restores it to the hamburger on close', async () => {
    /**
     * The behaviour a hand-rolled drawer usually lacks: closing the menu drops
     * focus to `<body>` and the next Tab restarts from the top of the document.
     */
    render(<Fixture />);
    const trigger = screen.getByRole('button', { name: 'Open navigation menu' });
    await userEvent.click(trigger);
    await screen.findByRole('dialog', { name: 'Main' });

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it('wires aria-expanded on the trigger, because Radix owns it', async () => {
    render(<Fixture />);
    const trigger = screen.getByRole('button', { name: 'Open navigation menu' });
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    await userEvent.click(trigger);
    await waitFor(() => expect(trigger.getAttribute('aria-expanded')).toBe('true'));
  });

  it('hides the hamburger at md and up, where the rail is showing', () => {
    render(<Fixture />);
    expect(screen.getByRole('button', { name: 'Open navigation menu' }).className).toContain(
      'md:hidden',
    );
  });
});

describe('AppShell, the resize case it CAN handle', () => {
  it('closes an open drawer when the viewport crosses to desktop', async () => {
    /**
     * Otherwise the rail and the drawer are both showing, with a scrim over the
     * page and no way to see what you clicked. This is the one of the three
     * lifecycle cases that is pure layout, so the shell owns it , closing on
     * navigation needs a router and stays the caller's job.
     */
    render(<Fixture />);
    await userEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    await screen.findByRole('dialog', { name: 'Main' });

    setViewport(true);
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('leaves a closed drawer alone on resize', async () => {
    const onSidebarOpenChange = vi.fn();
    render(<Fixture onSidebarOpenChange={onSidebarOpenChange} />);
    setViewport(true);
    expect(onSidebarOpenChange).not.toHaveBeenCalled();
  });
});

describe('AppShell, controlled and uncontrolled', () => {
  it('reports state changes while staying uncontrolled', async () => {
    const onSidebarOpenChange = vi.fn();
    render(<Fixture onSidebarOpenChange={onSidebarOpenChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    expect(onSidebarOpenChange).toHaveBeenCalledWith(true);
    expect(await screen.findByRole('dialog')).toBeTruthy();
  });

  it('obeys a controlled value and does not self-open', async () => {
    const onSidebarOpenChange = vi.fn();
    render(<Fixture sidebarOpen={false} onSidebarOpenChange={onSidebarOpenChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    expect(onSidebarOpenChange).toHaveBeenCalledWith(true);
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('useAppShell', () => {
  it('gives the caller a stable closeSidebar for the route-change effect', async () => {
    /**
     * The shell has no router, so closing on navigation is one `useEffect` in the
     * consumer's own shell file. `closeSidebar` has to keep its identity or that
     * effect re-runs every render and slams the drawer shut mid-open.
     */
    const seen = new Set<() => void>();
    function Probe({ route }: { route: string }) {
      const { closeSidebar } = useAppShell();
      seen.add(closeSidebar);
      useEffect(closeSidebar, [route, closeSidebar]);
      return null;
    }
    const { rerender } = render(
      <Fixture>
        <Probe route="/a" />
      </Fixture>,
    );
    rerender(
      <Fixture>
        <Probe route="/a" />
      </Fixture>,
    );
    expect(seen.size).toBe(1);
  });

  it('closes the drawer when the caller signals a navigation', async () => {
    function Probe({ route }: { route: string }) {
      const { closeSidebar } = useAppShell();
      useEffect(closeSidebar, [route, closeSidebar]);
      return null;
    }
    const { rerender } = render(
      <Fixture>
        <Probe route="/a" />
      </Fixture>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    await screen.findByRole('dialog');
    rerender(
      <Fixture>
        <Probe route="/b" />
      </Fixture>,
    );
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('throws a useful message outside the shell', () => {
    function Orphan() {
      useAppShell();
      return null;
    }
    expect(() => render(<Orphan />)).toThrow(/must be called inside an <AppShell>/);
  });
});

describe('AppShell, glass', () => {
  it('blurs the header and does NOT blur the rail', () => {
    /**
     * The header is Tier O: page content genuinely passes under a sticky bar, so
     * its backdrop is unknowable. The rail sits BESIDE the scroll region, so a
     * blur there is a second live backdrop layer on every page for no visual
     * gain.
     */
    const { container } = render(<Fixture />);
    expect(container.querySelector('[data-slot="app-shell-header"]')!.className).toContain('glass');
    const rail = container.querySelector('[data-slot="app-shell-rail"]')!.className;
    expect(rail).toContain('glass-surface');
    expect(rail).not.toContain('glass-surface-blur');
  });

  it('applies the Tier-S rail material without stripping it', () => {
    /**
     * The temptation is `shadow-none border-0`, because those edges are
     * off-screen anyway , and that deletes the inset specular highlight that IS
     * dark mode's material.
     */
    const { container } = render(<Fixture />);
    const rail = container.querySelector('[data-slot="app-shell-rail"]')!.className;
    expect(rail).not.toContain('shadow-none');
    expect(rail).not.toMatch(/\bborder-0\b/);
  });

  it('keeps the header below the dropdown layer', () => {
    /**
     * Portalled Radix content lands at `z-dropdown` (1000). A header at 1100
     * would paint over its own account menu, and raising the menu to compensate
     * starts an arms race with the modal and toast layers.
     */
    const { container } = render(<Fixture />);
    expect(container.querySelector('[data-slot="app-shell-header"]')!.className).toContain(
      'z-sticky',
    );
  });

  it('offers the opaque surfaces as a first-class choice, not an override', () => {
    const { container } = render(
      <Fixture
        sidebarSurface="panel"
        header={
          <AppShellHeader surface="panel">
            <AppShellSidebarTrigger />
          </AppShellHeader>
        }
      />,
    );
    expect(container.querySelector('[data-slot="app-shell-header"]')!.className).not.toContain(
      'glass',
    );
    expect(container.querySelector('[data-slot="app-shell-rail"]')!.className).not.toContain(
      'glass',
    );
  });
});

describe('AppShell, axe', () => {
  it('finds no violations on the closed shell', async () => {
    render(<Fixture />);
    const violations = await auditElement(document.body);
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  it('finds no violations with the drawer open', async () => {
    render(<Fixture />);
    await userEvent.click(screen.getByRole('button', { name: 'Open navigation menu' }));
    const drawer = await screen.findByRole('dialog', { name: 'Main' });
    const violations = await auditElement(drawer);
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
