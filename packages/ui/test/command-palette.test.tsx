import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandPalette,
  CommandSeparator,
  CommandShortcut,
} from '../../../registry/velobits/ui/command-palette';
import { auditElement, describeViolations } from './axe';

/**
 * Unlike `DropdownMenu`, these rows ARE clickable in tests: cmdk is not a Radix
 * menu, so there is no `disableOutsidePointerEvents` layer setting
 * `pointer-events: none` on `document.body`. Selection still moves with the
 * arrow keys while focus stays in the input , that is the whole point of a
 * palette, and it is why the highlight rides `data-selected` rather than focus.
 */
function Inline({ onSelect = () => {} }: { onSelect?: (value: string) => void }) {
  return (
    <CommandPalette>
      <CommandInput placeholder="Search…" />
      <CommandList>
        <CommandEmpty>No results.</CommandEmpty>
        <CommandGroup heading="Flags">
          <CommandItem value="new-flag" onSelect={onSelect}>
            New flag
            <CommandShortcut>⌘N</CommandShortcut>
          </CommandItem>
          <CommandItem value="archive-flag" onSelect={onSelect}>
            Archive flag
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading="Environments">
          <CommandItem value="new-environment" onSelect={onSelect}>
            New environment
          </CommandItem>
        </CommandGroup>
      </CommandList>
    </CommandPalette>
  );
}

describe('CommandPalette, inline', () => {
  it('renders a combobox over a listbox of options', () => {
    render(<Inline />);
    expect(screen.getByRole('combobox')).toBeTruthy();
    expect(screen.getByRole('listbox')).toBeTruthy();
    expect(screen.getAllByRole('option')).toHaveLength(3);
  });

  it('filters options as the user types, and restores them on clear', async () => {
    render(<Inline />);
    const input = screen.getByRole('combobox');

    await userEvent.type(input, 'env');
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(1));
    expect(screen.getByRole('option').textContent).toContain('New environment');

    await userEvent.clear(input);
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(3));
  });

  it('shows the empty state only when nothing matches', async () => {
    render(<Inline />);
    expect(screen.queryByText('No results.')).toBeNull();
    await userEvent.type(screen.getByRole('combobox'), 'zzzz');
    await waitFor(() => expect(screen.getByText('No results.')).toBeTruthy());
    expect(screen.queryAllByRole('option')).toHaveLength(0);
  });

  it('groups options and labels each group from its heading', () => {
    render(<Inline />);
    const groups = screen.getAllByRole('group');
    expect(groups).toHaveLength(2);
    const names = groups.map(
      (g) => document.getElementById(g.getAttribute('aria-labelledby')!)?.textContent,
    );
    expect(names).toEqual(['Flags', 'Environments']);
  });

  it('hides the separator from the accessibility tree', () => {
    /**
     * cmdk hard-codes `role="separator"` after its prop spread, and a separator
     * is not a permitted child of a `listbox` , axe reports it as
     * `aria-required-children`. The rule between two named groups is purely
     * visual, so `aria-hidden` is the fix rather than a suppression.
     */
    render(<Inline />);
    const separator = document.querySelector('[data-slot="command-separator"]')!;
    expect(separator.getAttribute('role')).toBe('separator');
    expect(separator.getAttribute('aria-hidden')).toBe('true');
  });

  it('stays opaque inline , the glass tier is only for surfaces that float', () => {
    /**
     * `.glass` is Tier O. An embedded palette sits on a real panel with page
     * content around it rather than over it, which is exactly the case
     * `glass.css` forbids.
     */
    render(<Inline />);
    expect(document.querySelector('[data-slot="command-palette"]')!.className).not.toContain(
      'glass',
    );
  });
});

describe('CommandPalette, keyboard navigation', () => {
  it('keeps focus in the input while the arrows move the selection', async () => {
    /**
     * The behavioural difference from a Radix menu, and the reason a palette
     * cannot be a DropdownMenu: focus must stay in the input so the user can keep
     * typing, so the active row is tracked by attribute rather than by focus.
     */
    render(<Inline />);
    const input = screen.getByRole('combobox');
    input.focus();

    const [first, second] = screen.getAllByRole('option');
    await waitFor(() => expect(first!.getAttribute('data-selected')).toBe('true'));

    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() => expect(second!.getAttribute('data-selected')).toBe('true'));
    expect(first!.getAttribute('data-selected')).toBe('false');
    expect(document.activeElement).toBe(input);

    await userEvent.keyboard('{ArrowUp}');
    await waitFor(() => expect(first!.getAttribute('data-selected')).toBe('true'));
    expect(document.activeElement).toBe(input);
  });

  it('mirrors the selection into aria-activedescendant, which is what is announced', async () => {
    render(<Inline />);
    const input = screen.getByRole('combobox');
    input.focus();
    await userEvent.keyboard('{ArrowDown}');

    await waitFor(() => {
      const active = input.getAttribute('aria-activedescendant');
      expect(active).toBeTruthy();
      expect(document.getElementById(active!)!.getAttribute('data-selected')).toBe('true');
    });
  });

  it('runs the selected item on Enter', async () => {
    const onSelect = vi.fn();
    render(<Inline onSelect={onSelect} />);
    const input = screen.getByRole('combobox');
    input.focus();
    await userEvent.keyboard('{ArrowDown}{Enter}');
    await waitFor(() => expect(onSelect).toHaveBeenCalledWith('archive-flag'));
  });

  it('runs the item the filter narrowed to, not the one that was first', async () => {
    const onSelect = vi.fn();
    render(<Inline onSelect={onSelect} />);
    await userEvent.type(screen.getByRole('combobox'), 'archive');
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(1));
    await userEvent.keyboard('{Enter}');
    await waitFor(() => expect(onSelect).toHaveBeenCalledWith('archive-flag'));
  });

  it('highlights through data-[selected=true] and never through :hover', () => {
    /**
     * cmdk is not Radix Menu, so `data-highlighted` does not exist here , but the
     * rule that produced that refusal does: a hover-only highlight leaves the
     * keyboard user with no visible cursor while the arrows work perfectly.
     */
    render(<Inline />);
    const cls = screen.getAllByRole('option')[0]!.className;
    expect(cls).toContain('data-[selected=true]:bg-highlight');
    expect(cls).not.toMatch(/(^|[\s:])hover:/);
  });
});

describe('CommandDialog', () => {
  function Controlled({ shortcut }: { shortcut?: string | false }) {
    const [open, setOpen] = useState(false);
    return (
      <>
        <button onClick={() => setOpen(true)}>Open palette</button>
        <CommandDialog open={open} onOpenChange={setOpen} shortcut={shortcut}>
          <CommandInput placeholder="Search…" />
          <CommandList>
            <CommandEmpty>No results.</CommandEmpty>
            <CommandGroup heading="Flags">
              <CommandItem value="new-flag">New flag</CommandItem>
            </CommandGroup>
          </CommandList>
        </CommandDialog>
      </>
    );
  }

  it('renders nothing until it is opened', () => {
    render(<Controlled />);
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(screen.queryByRole('combobox')).toBeNull();
  });

  it('opens, floats on the glass tier, and closes on Escape', async () => {
    render(<Controlled />);
    await userEvent.click(screen.getByRole('button', { name: 'Open palette' }));
    const dialog = await waitFor(() => screen.getByRole('dialog'));

    // Here it DOES float, so here it is glass.
    expect(dialog.className).toContain('glass');
    expect(dialog.className).toContain('z-modal');

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('carries a visually hidden title and description, so Radix has both', async () => {
    /**
     * A palette has no visible heading. Omitting the title makes Radix log a
     * development error and leaves the dialog unnamed; omitting the description
     * leaves `aria-describedby` dangling. Hiding them satisfies both.
     */
    render(<Controlled />);
    await userEvent.click(screen.getByRole('button', { name: 'Open palette' }));
    const dialog = await waitFor(() => screen.getByRole('dialog'));

    expect(dialog.getAttribute('aria-labelledby')).toBeTruthy();
    expect(document.getElementById(dialog.getAttribute('aria-labelledby')!)!.textContent).toBe(
      'Command palette',
    );
    expect(document.getElementById(dialog.getAttribute('aria-describedby')!)!.textContent).toBe(
      'Search for a command to run',
    );
  });

  it('anchors near the top, because a centred palette jumps on every keystroke', async () => {
    render(<Controlled />);
    await userEvent.click(screen.getByRole('button', { name: 'Open palette' }));
    const dialog = await waitFor(() => screen.getByRole('dialog'));
    expect(dialog.className).toContain('top-[15vh]');
    // Horizontal centring is symmetric, so the physical pair is correct in both
    // directions , `start-1/2` would break RTL, because translate does not flip.
    expect(dialog.className).toContain('left-1/2');
    expect(dialog.className).toContain('-translate-x-1/2');
    expect(dialog.className).not.toContain('start-1/2');
  });
});

describe('CommandDialog, the ⌘K shortcut', () => {
  function Controlled({ shortcut }: { shortcut?: string | false }) {
    const [open, setOpen] = useState(false);
    return (
      <CommandDialog open={open} onOpenChange={setOpen} shortcut={shortcut}>
        <CommandInput placeholder="Search…" />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
        </CommandList>
      </CommandDialog>
    );
  }

  it('installs NO global listener unless asked', async () => {
    /**
     * The refusal that matters for a shared library: the editor app's editor already
     * owns ⌘K. A design system that grabs it on import produces a bug nobody can
     * locate, so the binding is opt-in.
     */
    render(<Controlled />);
    await userEvent.keyboard('{Meta>}k{/Meta}');
    expect(screen.queryByRole('dialog')).toBeNull();

    await userEvent.keyboard('{Control>}k{/Control}');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('opens on ⌘K when opted in', async () => {
    render(<Controlled shortcut="k" />);
    await userEvent.keyboard('{Meta>}k{/Meta}');
    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy());
  });

  it('opens on Ctrl+K too, so the binding is not Mac-only', async () => {
    render(<Controlled shortcut="k" />);
    await userEvent.keyboard('{Control>}k{/Control}');
    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy());
  });

  it('toggles rather than only opening', async () => {
    render(<Controlled shortcut="k" />);
    await userEvent.keyboard('{Meta>}k{/Meta}');
    await waitFor(() => expect(screen.getByRole('dialog')).toBeTruthy());
    await userEvent.keyboard('{Meta>}k{/Meta}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('ignores the bare key, so it can never intercept typing', async () => {
    render(<Controlled shortcut="k" />);
    await userEvent.keyboard('k');
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('removes the listener on unmount', async () => {
    const { unmount } = render(<Controlled shortcut="k" />);
    const remove = vi.spyOn(document, 'removeEventListener');
    unmount();
    expect(remove.mock.calls.some(([type]) => type === 'keydown')).toBe(true);
    remove.mockRestore();
  });

  it('does not re-subscribe when the parent re-renders with a new callback', () => {
    /**
     * The memo trap this component is built to avoid: `onOpenChange` is almost
     * always an inline arrow, so depending on it would tear down and re-attach a
     * document listener on every parent render. Both the callback and the open
     * state are read through refs and the effect depends only on the key.
     */
    const add = vi.spyOn(document, 'addEventListener');
    function Parent({ tick }: { tick: number }) {
      return (
        <CommandDialog open={false} onOpenChange={() => void tick} shortcut="k">
          <CommandInput />
          <CommandList />
        </CommandDialog>
      );
    }
    const { rerender } = render(<Parent tick={0} />);
    const afterMount = add.mock.calls.filter(([type]) => type === 'keydown').length;
    rerender(<Parent tick={1} />);
    rerender(<Parent tick={2} />);
    expect(add.mock.calls.filter(([type]) => type === 'keydown').length).toBe(afterMount);
    add.mockRestore();
  });
});

describe('CommandPalette, source-level contracts', () => {
  it('points at itself as the answer to the DropdownMenu input refusal', () => {
    const source = readFileSync(
      join(process.cwd(), '../../registry/velobits/ui/command-palette.tsx'),
      'utf8',
    );
    expect(source).toMatch(/DropdownMenu cannot host|cannot host/i);
    expect(source).toMatch(/data-\[selected=true\]/);
    // No blur-radius animation anywhere: it repaints the whole backdrop per frame.
    expect(source).not.toMatch(/backdrop-blur|transition-\[backdrop/);
  });

  it('carries the use client directive the tsup build depends on', () => {
    const source = readFileSync(
      join(process.cwd(), '../../registry/velobits/ui/command-palette.tsx'),
      'utf8',
    );
    expect(source.startsWith("'use client';")).toBe(true);
  });
});

describe('CommandPalette accessibility', () => {
  it('passes axe inline', async () => {
    render(
      <main>
        <Inline />
      </main>,
    );
    const violations = await auditElement(document.body);
    expect(violations.length, describeViolations(violations)).toBe(0);
  });

  it('passes axe as an open dialog, excluding only Radix modal machinery', async () => {
    function Fixture() {
      return (
        <main>
          <CommandDialog open onOpenChange={() => {}}>
            <CommandInput placeholder="Search…" />
            <CommandList>
              <CommandEmpty>No results.</CommandEmpty>
              <CommandGroup heading="Flags">
                <CommandItem value="a">
                  New flag
                  <CommandShortcut>⌘N</CommandShortcut>
                </CommandItem>
              </CommandGroup>
            </CommandList>
          </CommandDialog>
        </main>
      );
    }
    render(<Fixture />);
    await waitFor(() => screen.getByRole('dialog'));

    const violations = await auditElement(document.body);

    /**
     * Same subtraction as `dropdown-menu.test.tsx`, for the same reason: a modal
     * Radix layer marks the rest of the page `aria-hidden` while leaving it
     * focusable, because it relies on a focus SCOPE that axe cannot see. Filtered
     * node by node on Radix-specific attributes so a genuine violation in our own
     * markup still fails , and kept file-local rather than hoisted into `./axe`,
     * which would exempt every suite from the rule.
     */
    const isRadixModalMachinery = (html: string) =>
      html.includes('radix-focus-guard') || html.includes('data-aria-hidden');

    const ours = violations
      .map((v) => ({ ...v, nodes: v.nodes.filter((n) => !isRadixModalMachinery(n.html)) }))
      .filter((v) => v.nodes.length > 0);

    expect(ours.length, describeViolations(ours)).toBe(0);
    expect(violations.map((v) => v.id).filter((id) => id !== 'aria-hidden-focus')).toEqual([]);
  });
});
