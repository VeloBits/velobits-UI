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

describe('CommandDialog, the cmdk props it routes past the Dialog', () => {
  /**
   * `CommandDialog` renders two roots , Radix's `Dialog.Root` and cmdk's
   * `Command` , and only one of them can take the rest spread. It takes the
   * dialog, so every cmdk root prop has to be named and re-routed by hand.
   *
   * An unrouted prop lands on `Dialog.Root`, which destructures six props and
   * drops the rest: no throw, no warning, and a custom `filter` that never runs.
   * TypeScript catches the literal form , the props interface is closed, so an
   * unrouted prop is an excess-property error , and goes quiet exactly where the
   * type system does: JavaScript, a spread-widened rest, a widened `string`.
   *
   * One test per routed prop, because each one goes missing on its own.
   */
  function Palette({ children, ...props }: React.ComponentProps<typeof CommandDialog>) {
    return (
      <CommandDialog open onOpenChange={() => {}} {...props}>
        <CommandInput placeholder="Search…" />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
          <CommandGroup heading="Flags">{children}</CommandGroup>
        </CommandList>
      </CommandDialog>
    );
  }

  const ROWS = (
    <>
      <CommandItem value="new-flag">New flag</CommandItem>
      <CommandItem value="archive-flag">Archive flag</CommandItem>
      <CommandItem value="new-environment">New environment</CommandItem>
    </>
  );

  it('runs a custom `filter`, which is the whole reason for the split', async () => {
    /**
     * The reported gap. A palette whose rows are scored by the app , a fuzzy
     * matcher, a slug, a description that is searchable but not displayed , is
     * the ordinary case, and before the routing existed the function was
     * accepted, type-checked and never called.
     *
     * Scored so ONLY `archive-flag` survives any search, which no default
     * scorer would do: it is proof the function ran, not that cmdk did.
     */
    const filter = vi.fn((value: string) => (value === 'archive-flag' ? 1 : 0));
    render(<Palette filter={filter}>{ROWS}</Palette>);
    await waitFor(() => screen.getByRole('dialog'));

    await userEvent.type(screen.getByRole('combobox'), 'new');
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(1));
    expect(screen.getByRole('option').textContent).toContain('Archive flag');
    expect(filter).toHaveBeenCalled();
  });

  it('routes `shouldFilter={false}`, so a server-backed palette keeps its rows', async () => {
    /**
     * The remote-search case: the endpoint already decided what matches, and a
     * second client-side pass over the response hides rows the server
     * deliberately returned. Typing something no row contains must therefore
     * leave all three standing.
     */
    render(<Palette shouldFilter={false}>{ROWS}</Palette>);
    await waitFor(() => screen.getByRole('dialog'));

    await userEvent.type(screen.getByRole('combobox'), 'zzzz');
    await waitFor(() => expect(screen.getAllByRole('option')).toHaveLength(3));
    expect(screen.queryByText('No results.')).toBeNull();
  });

  it('routes `value` and `onValueChange`, so the highlight can be controlled', async () => {
    const onValueChange = vi.fn();
    render(
      <Palette value="new-environment" onValueChange={onValueChange}>
        {ROWS}
      </Palette>,
    );
    await waitFor(() => screen.getByRole('dialog'));

    await waitFor(() => {
      const selected = screen
        .getAllByRole('option')
        .find((option) => option.getAttribute('data-selected') === 'true');
      expect(selected!.textContent).toContain('New environment');
    });

    // Up, not down: the controlled value is the LAST row, and without `loop`
    // there is nowhere below it to move to , so a down arrow changes nothing and
    // the callback would correctly never fire.
    await userEvent.keyboard('{ArrowUp}');
    await waitFor(() => expect(onValueChange).toHaveBeenCalledWith('archive-flag'));
  });

  it('routes `defaultValue` without leaking it onto cmdk\u2019s div', async () => {
    /**
     * cmdk reads `defaultValue` for its initial state but does NOT destructure
     * it out of the rest it spreads onto its own element. React drops
     * `defaultValue` on a non-form element with no attribute and no warning, so
     * forwarding it is free , and this pins that, because it is exactly the kind
     * of thing a React major quietly changes.
     */
    render(<Palette defaultValue="archive-flag">{ROWS}</Palette>);
    const palette = await waitFor(() => document.querySelector('[data-slot="command-palette"]')!);

    await waitFor(() => {
      const selected = screen
        .getAllByRole('option')
        .find((option) => option.getAttribute('data-selected') === 'true');
      expect(selected!.textContent).toContain('Archive flag');
    });
    expect(palette.hasAttribute('defaultValue')).toBe(false);
    expect(palette.hasAttribute('defaultvalue')).toBe(false);
  });

  it('routes `loop`, `disablePointerSelection`, `vimBindings` and `label`', async () => {
    /**
     * Four props with no visible surface of their own, so they are checked
     * through the behaviour each one buys. `label` is the exception , it is a
     * DOM node. It names the INPUT: cmdk renders a hidden `<label htmlFor>` and
     * points the combobox's `aria-labelledby` at it. Not the dialog (that is
     * `title`) and not the listbox, which keeps cmdk's own "Suggestions".
     */
    const { unmount } = render(
      <Palette loop label="Flag commands">
        {ROWS}
      </Palette>,
    );
    await waitFor(() => screen.getByRole('dialog'));
    expect(document.querySelector('[cmdk-label]')!.textContent).toBe('Flag commands');
    // Which role it actually lands on, asserted rather than assumed.
    expect(screen.queryByRole('combobox', { name: 'Flag commands' })).toBeTruthy();
    expect(screen.queryByRole('listbox', { name: 'Flag commands' })).toBeNull();

    // `loop` wraps from the last row back to the first.
    await userEvent.keyboard('{ArrowUp}');
    await waitFor(() => {
      const selected = screen
        .getAllByRole('option')
        .find((option) => option.getAttribute('data-selected') === 'true');
      expect(selected!.textContent).toContain('New environment');
    });
    unmount();

    // vimBindings is ON by default, so Ctrl+n moves the highlight; `false` is
    // the opt-out an app that binds Ctrl+n itself needs.
    render(<Palette vimBindings={false}>{ROWS}</Palette>);
    await waitFor(() => screen.getByRole('dialog'));
    await userEvent.keyboard('{Control>}n{/Control}');
    await waitFor(() => {
      const selected = screen
        .getAllByRole('option')
        .find((option) => option.getAttribute('data-selected') === 'true');
      expect(selected!.textContent).toContain('New flag');
    });
  });

  it('still sends the dialog\u2019s own props to the dialog', async () => {
    /**
     * The other half of the split, and the half that breaks if someone widens
     * the destructure too far: `modal` and `defaultOpen` belong to
     * `Dialog.Root`, and routing them to cmdk would spread them onto a div.
     */
    render(
      <CommandDialog defaultOpen modal={false} title="Flag palette">
        <CommandInput placeholder="Search…" />
        <CommandList>
          <CommandEmpty>No results.</CommandEmpty>
        </CommandList>
      </CommandDialog>,
    );
    const dialog = await waitFor(() => screen.getByRole('dialog'));
    expect(document.getElementById(dialog.getAttribute('aria-labelledby')!)!.textContent).toBe(
      'Flag palette',
    );
    // `modal={false}` leaves the rest of the page unhidden.
    expect(document.body.getAttribute('aria-hidden')).toBeNull();
  });

  it('routes cmdk\u2019s root prop list EXACTLY , asserted in both directions', () => {
    /**
     * The routing is only correct while it is exhaustive, and the type layer
     * does not make it so on its own: `PaletteRootProps['filter']` errors if
     * cmdk REMOVES a prop, and says nothing when cmdk ADDS one. An added root
     * prop would land on `Dialog.Root` and be dropped.
     *
     * So this reads cmdk's root declaration and compares SETS, not a subset.
     * The earlier version of this test scanned the whole `.d.ts` with
     * `/^\s{4}(\w+)\?:/` , which also swept up Item, Group, Input and Dialog
     * props (`keywords`, `heading`, `forceMount`, `container`…) and then only
     * checked that our nine were among them. That direction catches a rename
     * and cannot catch the addition the comment claimed it did.
     */
    const source = readFileSync(
      join(process.cwd(), '../../registry/velobits/ui/command-palette.tsx'),
      'utf8',
    );
    const cmdkTypes = readFileSync(
      join(process.cwd(), '../../node_modules/cmdk/dist/index.d.ts'),
      'utf8',
    );

    /** Just the root: `declare const Command: …` up to the next declaration. */
    const rootStart = cmdkTypes.indexOf('declare const Command:');
    expect(
      rootStart,
      'cmdk no longer declares `Command` , this test cannot see the root',
    ).toBeGreaterThan(-1);
    const rootBlock = cmdkTypes.slice(rootStart, cmdkTypes.indexOf('\ndeclare ', rootStart + 1));

    /**
     * `ref` is React's, and `asChild` is deliberately NOT routed , this
     * component owns the element it renders inside its own dialog, so there is
     * nothing useful to substitute, and passing it is a type error. Both are
     * listed here so the exclusion stays a decision.
     */
    const NOT_ROUTED = new Set(['ref', 'asChild']);
    const declared = [...rootBlock.matchAll(/^ {4}(\w+)\?:/gm)]
      .map((m) => m[1]!)
      .filter((prop) => !NOT_ROUTED.has(prop));

    const ROOT_PROPS = [
      'label',
      'shouldFilter',
      'filter',
      'defaultValue',
      'value',
      'onValueChange',
      'loop',
      'disablePointerSelection',
      'vimBindings',
    ];

    // Set equality. A cmdk upgrade that adds a root prop fails HERE, naming it,
    // rather than silently leaving it on the Dialog , update ROOT_PROPS, the
    // interface and the destructure together.
    expect([...declared].sort()).toEqual([...ROOT_PROPS].sort());

    for (const prop of ROOT_PROPS) {
      expect(source, `CommandDialogProps does not declare \`${prop}\``).toMatch(
        new RegExp(`\\n  ${prop}\\?: PaletteRootProps\\['${prop}'\\];`),
      );
      expect(source, `CommandDialog does not destructure \`${prop}\``).toMatch(
        new RegExp(`\\n  ${prop},\\n`),
      );
      expect(source, `CommandPalette is not passed \`${prop}\``).toMatch(
        new RegExp(`\\n            ${prop}=\\{${prop}\\}`),
      );
    }
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
