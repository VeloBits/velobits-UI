import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from '../../../registry/velobits/ui/dropdown-menu';
import { auditElement } from './axe';

/**
 * ## Two rules this file demonstrates rather than describes
 *
 * 1. **Open with the keyboard, not the pointer.** Radix modal content sets
 *    `pointer-events: none` on `document.body`, and `userEvent` THROWS on any
 *    element that inherits it. `userEvent.keyboard('{Enter}')` on the trigger
 *    opens the menu AND highlights the first item, which is what the assertions
 *    below need anyway.
 * 2. **Activate items with `fireEvent.keyDown`.** Same reason. Radix's own
 *    handler turns Enter/Space into `currentTarget.click()`, so `onSelect` fires
 *    exactly as it does for a real user.
 *
 * See the file docblock in `registry/velobits/ui/dropdown-menu.tsx` — this is
 * refusal 3, made executable.
 */
async function openMenu() {
  getTrigger().focus();
  await userEvent.keyboard('{Enter}');
  return waitFor(() => screen.getByRole('menu'));
}

/**
 * `getByText`, not `getByRole('button')`.
 *
 * While a modal menu is open Radix's `hideOthers` marks everything outside the
 * content `aria-hidden` — INCLUDING the trigger. So the trigger leaves the
 * accessibility tree and `getByRole('button', { name: 'Open' })` stops finding
 * it mid-test, which reads as "the trigger unmounted". `getByText` queries the
 * DOM rather than the a11y tree and is stable across both states.
 */
function getTrigger() {
  return screen.getByText('Open');
}

function Basic({
  defaultOpen = false,
  onSelect = () => {},
  onDelete = () => {},
}: {
  defaultOpen?: boolean;
  onSelect?: () => void;
  onDelete?: () => void;
}) {
  return (
    <DropdownMenu defaultOpen={defaultOpen}>
      <DropdownMenuTrigger>Open</DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuItem onSelect={onSelect}>
            Edit
            <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
          </DropdownMenuItem>
          <DropdownMenuItem>Duplicate</DropdownMenuItem>
          <DropdownMenuItem disabled>Archive</DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="danger" onSelect={onDelete}>
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

describe('DropdownMenu, opening and closing', () => {
  it('renders no content until the trigger is used', () => {
    render(<Basic />);
    expect(screen.queryByRole('menu')).toBeNull();
    expect(getTrigger().getAttribute('aria-expanded')).toBe('false');
  });

  it('opens on the trigger and reports expanded', async () => {
    render(<Basic />);
    await openMenu();
    expect(screen.getByRole('menu')).toBeTruthy();
    expect(getTrigger().getAttribute('aria-expanded')).toBe('true');
    expect(screen.getAllByRole('menuitem')).toHaveLength(4);
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    render(<Basic />);
    await openMenu();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
    // Losing focus to <body> here is the bug that makes a menu a dead end for
    // keyboard users: there is nothing to Tab from.
    expect(document.activeElement).toBe(getTrigger());
  });

  it('portals the content out of the trigger subtree', async () => {
    /**
     * Which is why Playwright cannot reliably click these items, and why the
     * viewport/stacking notes matter: the content is not a descendant of
     * whatever the trigger lives in, so an ancestor `overflow: hidden` cannot
     * clip it — and an ancestor's z-index cannot raise it either.
     */
    const { container } = render(<Basic />);
    const menu = await openMenu();
    expect(container.contains(menu)).toBe(false);
    expect(document.body.contains(menu)).toBe(true);
  });
});

describe('DropdownMenu, keyboard navigation', () => {
  it('highlights the first item when opened with the keyboard', async () => {
    render(<Basic />);
    await openMenu();
    await waitFor(() =>
      expect(screen.getByRole('menuitem', { name: /Edit/ }).hasAttribute('data-highlighted')).toBe(
        true,
      ),
    );
  });

  it('moves the highlight with ArrowDown and skips the disabled item', async () => {
    render(<Basic />);
    await openMenu();
    await userEvent.keyboard('{ArrowDown}');

    await waitFor(() =>
      expect(
        screen.getByRole('menuitem', { name: 'Duplicate' }).hasAttribute('data-highlighted'),
      ).toBe(true),
    );
    expect(screen.getByRole('menuitem', { name: /Edit/ }).hasAttribute('data-highlighted')).toBe(
      false,
    );

    // Archive is disabled, so the next stop is Delete, not Archive.
    await userEvent.keyboard('{ArrowDown}');
    await waitFor(() =>
      expect(
        screen.getByRole('menuitem', { name: 'Delete' }).hasAttribute('data-highlighted'),
      ).toBe(true),
    );
    expect(screen.getByRole('menuitem', { name: 'Archive' }).hasAttribute('data-highlighted')).toBe(
      false,
    );
  });

  it('moves back up with ArrowUp', async () => {
    render(<Basic />);
    await openMenu();
    await userEvent.keyboard('{ArrowDown}{ArrowUp}');
    await waitFor(() =>
      expect(screen.getByRole('menuitem', { name: /Edit/ }).hasAttribute('data-highlighted')).toBe(
        true,
      ),
    );
  });

  it('activates the highlighted item on Enter and closes', async () => {
    const onSelect = vi.fn();
    render(<Basic onSelect={onSelect} />);
    await openMenu();
    fireEvent.keyDown(screen.getByRole('menuitem', { name: /Edit/ }), { key: 'Enter' });
    expect(onSelect).toHaveBeenCalledOnce();
    await waitFor(() => expect(screen.queryByRole('menu')).toBeNull());
  });

  it('activates on Space too', async () => {
    const onDelete = vi.fn();
    render(<Basic onDelete={onDelete} />);
    await openMenu();
    fireEvent.keyDown(screen.getByRole('menuitem', { name: 'Delete' }), { key: ' ' });
    expect(onDelete).toHaveBeenCalledOnce();
  });

  it('does not activate a disabled item', async () => {
    const onSelect = vi.fn();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem disabled onSelect={onSelect}>
            Archive
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await openMenu();
    const item = screen.getByRole('menuitem', { name: 'Archive' });
    expect(item.getAttribute('aria-disabled')).toBe('true');
    fireEvent.keyDown(item, { key: 'Enter' });
    expect(onSelect).not.toHaveBeenCalled();
  });
});

describe('DropdownMenu, checkbox and radio items', () => {
  it('toggles a checkbox item and reports aria-checked', async () => {
    const onCheckedChange = vi.fn();
    function Fixture() {
      return (
        <DropdownMenu>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuCheckboxItem checked={false} onCheckedChange={onCheckedChange}>
              Show archived
            </DropdownMenuCheckboxItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    }
    render(<Fixture />);
    await openMenu();

    const item = screen.getByRole('menuitemcheckbox', { name: 'Show archived' });
    expect(item.getAttribute('aria-checked')).toBe('false');
    fireEvent.keyDown(item, { key: 'Enter' });
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it('renders the tick only for the checked item', async () => {
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem checked>Show archived</DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={false}>Show drafts</DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const [checked, unchecked] = screen.getAllByRole('menuitemcheckbox');
    expect(checked!.getAttribute('aria-checked')).toBe('true');
    expect(checked!.querySelector('svg')).toBeTruthy();
    // Radix unmounts the indicator when unchecked, so this is the real signal.
    expect(unchecked!.querySelector('svg')).toBeNull();
  });

  it('reserves the indicator gutter with logical padding, so RTL needs no mirror', () => {
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem checked>Show archived</DropdownMenuCheckboxItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const item = screen.getByRole('menuitemcheckbox');
    expect(item.className).toContain('ps-8');
    expect(item.className).not.toMatch(/\bpl-8\b/);
    expect(item.querySelector('span')!.className).toContain('start-2');
  });

  it('selects a radio item and reports a single checked value', async () => {
    const onValueChange = vi.fn();
    render(
      <DropdownMenu>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuRadioGroup value="prod" onValueChange={onValueChange}>
            <DropdownMenuRadioItem value="dev">Development</DropdownMenuRadioItem>
            <DropdownMenuRadioItem value="prod">Production</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    await openMenu();

    const items = screen.getAllByRole('menuitemradio');
    expect(items.map((i) => i.getAttribute('aria-checked'))).toEqual(['false', 'true']);
    fireEvent.keyDown(items[0]!, { key: 'Enter' });
    expect(onValueChange).toHaveBeenCalledWith('dev');
  });
});

describe('DropdownMenu, submenus', () => {
  function WithSub() {
    return (
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>Move to</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>Production</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  it('opens the submenu on ArrowRight and closes it on ArrowLeft', async () => {
    render(<WithSub />);
    const trigger = await waitFor(() => screen.getByRole('menuitem', { name: 'Move to' }));
    expect(trigger.getAttribute('aria-expanded')).toBe('false');

    fireEvent.keyDown(trigger, { key: 'ArrowRight' });
    await waitFor(() => expect(screen.getAllByRole('menu')).toHaveLength(2));
    expect(screen.getByRole('menuitem', { name: 'Production' })).toBeTruthy();

    fireEvent.keyDown(screen.getByRole('menuitem', { name: 'Production' }), { key: 'ArrowLeft' });
    await waitFor(() => expect(screen.getAllByRole('menu')).toHaveLength(1));
  });

  it('stacks the submenu on the elevated glass tier, not plain glass on plain glass', async () => {
    /**
     * Two `.glass` panels at the same alpha composite into one indistinct smear
     * — which is the whole reason `glass-elevated` exists.
     */
    render(<WithSub />);
    const trigger = await waitFor(() => screen.getByRole('menuitem', { name: 'Move to' }));
    fireEvent.keyDown(trigger, { key: 'ArrowRight' });
    const sub = await waitFor(() =>
      document.querySelector('[data-slot="dropdown-menu-sub-content"]'),
    );
    expect(sub!.className).toContain('glass');
    expect(sub!.className).toContain('glass-elevated');
  });

  it('flips the submenu chevron under RTL, because rotate is not a logical property', () => {
    render(<WithSub />);
    return waitFor(() => {
      const trigger = screen.getByRole('menuitem', { name: 'Move to' });
      const chevron = trigger.querySelector('svg')!;
      expect(chevron.getAttribute('class')).toContain('rtl:rotate-180');
      // And it sits at the inline end, which flips for free.
      expect(chevron.getAttribute('class')).toContain('ms-auto');
    });
  });
});

describe('DropdownMenu, the styling refusals', () => {
  it('styles the highlight through data-[highlighted], never :hover', () => {
    /**
     * REFUSAL 1 (the consumer ADR). Radix moves real DOM focus for both the pointer and
     * the keyboard path and mirrors it onto `data-highlighted`. A `hover:`
     * highlight looks perfect with a mouse and is invisible to arrow keys.
     */
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem>Edit</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    const cls = screen.getByRole('menuitem', { name: 'Edit' }).className;
    expect(cls).toContain('data-[highlighted]:bg-highlight');
    expect(cls).not.toMatch(/(^|[\s:])hover:/);
  });

  it('applies the same rule to checkbox, radio and submenu-trigger rows', () => {
    render(
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuCheckboxItem checked={false}>Archived</DropdownMenuCheckboxItem>
          <DropdownMenuRadioGroup value="a">
            <DropdownMenuRadioItem value="a">A</DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
          <DropdownMenuSub>
            <DropdownMenuSubTrigger>More</DropdownMenuSubTrigger>
            <DropdownMenuSubContent>
              <DropdownMenuItem>X</DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuSub>
        </DropdownMenuContent>
      </DropdownMenu>,
    );
    for (const role of ['menuitemcheckbox', 'menuitemradio'] as const) {
      const cls = screen.getByRole(role).className;
      expect(cls, role).toContain('data-[highlighted]:bg-highlight');
      expect(cls, role).not.toMatch(/(^|[\s:])hover:/);
    }
    const subTrigger = screen.getByRole('menuitem', { name: 'More' });
    expect(subTrigger.className).toContain('data-[highlighted]:bg-highlight');
    expect(subTrigger.className).not.toMatch(/(^|[\s:])hover:/);
  });

  it('gives the danger variant its own highlighted pairing', () => {
    /** Red text on the neutral highlight is not the same thing as a red row. */
    render(<Basic defaultOpen />);
    const item = screen.getByRole('menuitem', { name: 'Delete' });
    expect(item.className).toContain('data-[variant=danger]:text-danger');
    expect(item.className).toContain('data-[variant=danger]:data-[highlighted]:bg-danger-soft');
    expect(item.getAttribute('data-variant')).toBe('danger');
  });

  it('contains no text input, and says so', () => {
    /**
     * REFUSAL 2 (the consumer ADR). A filter field inside a menu cannot keep focus —
     * Radix's content pulls focus back to the item list and typeahead swallows
     * the keystrokes — and the only lever that would hold it,
     * `onOpenAutoFocus`, is a private escape hatch on this primitive. The
     * pattern is a Dialog or a Popover.
     *
     * Asserted against the SOURCE rather than the render, because the failure
     * mode is a future contributor adding one, and the docblock is what stops
     * them.
     *
     * `process.cwd()`, not `import.meta.url`: vitest rewrites `import.meta` in
     * transformed modules, and the URL-relative form resolves to a `/@fs/…`
     * path that `readFileSync` cannot open. Same trap as
     * `registry-parity.test.ts`.
     */
    const source = readFileSync(
      join(process.cwd(), '../../registry/velobits/ui/dropdown-menu.tsx'),
      'utf8',
    );
    expect(source).toMatch(/CANNOT host a text input/);
    expect(source).toMatch(/onOpenAutoFocus/);
    // No <input>, and no Input import, anywhere in the component.
    expect(source).not.toMatch(/<input|from '\.\/input'/);
  });

  it('lands on the dropdown rung of the z ladder, below overlay and modal', () => {
    render(<Basic defaultOpen />);
    const content = document.querySelector('[data-slot="dropdown-menu-content"]')!;
    expect(content.className).toContain('z-dropdown');
    expect(content.className).toContain('glass');
  });

  it('puts the shortcut at the inline end with ms-auto, not ml-auto', () => {
    render(<Basic defaultOpen />);
    const cls = document.querySelector('[data-slot="dropdown-menu-shortcut"]')!.className;
    expect(cls).toContain('ms-auto');
    expect(cls).not.toMatch(/\bml-auto\b/);
  });

  it('animates transform and opacity only — never the blur radius', () => {
    /**
     * A blur-radius tween re-rasterises the entire backdrop every frame. This is
     * the assertion that catches someone "smoothing out" the glass entrance.
     */
    render(<Basic defaultOpen />);
    const cls = document.querySelector('[data-slot="dropdown-menu-content"]')!.className;
    expect(cls).toMatch(/data-\[state=open\]:animate-in/);
    expect(cls).toMatch(/data-\[state=closed\]:animate-out/);
    expect(cls).not.toMatch(/backdrop-blur|transition-\[backdrop/);
  });
});

describe('DropdownMenu accessibility', () => {
  it('passes axe with an open menu containing every item kind', async () => {
    const { container } = render(
      <main>
        <DropdownMenu defaultOpen>
          <DropdownMenuTrigger>Open</DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem>
                Edit
                <DropdownMenuShortcut>⌘E</DropdownMenuShortcut>
              </DropdownMenuItem>
              <DropdownMenuItem disabled>Archive</DropdownMenuItem>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuCheckboxItem checked>Show archived</DropdownMenuCheckboxItem>
            <DropdownMenuRadioGroup value="prod">
              <DropdownMenuRadioItem value="dev">Development</DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="prod">Production</DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="danger">Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </main>,
    );
    await waitFor(() => screen.getByRole('menu'));

    /**
     * The shared gate from `./axe`, rooted at the whole document rather than at
     * `container` — the menu is portalled to `<body>`.
     */
    const violations = await auditElement(document.body);

    /**
     * `aria-hidden-focus` fires twice on any open MODAL Radix layer, and neither
     * instance is ours:
     *
     *  - the `react-focus-guards` sentinels, which are `aria-hidden="true"` with
     *    `tabindex="0"` by design;
     *  - the rest of the page, which `hideOthers` marks `aria-hidden` while the
     *    menu is up — and which still contains the focusable trigger, because
     *    Radix relies on a focus SCOPE rather than on stripping tabindex.
     *
     * axe cannot see a focus scope, so it must report this; every shadcn app has
     * the identical finding. Both classes carry a Radix-specific attribute
     * (`data-radix-focus-guard`, `data-aria-hidden`) that nothing in this repo
     * emits, so they are subtracted NODE BY NODE rather than by turning the rule
     * off — if `aria-hidden-focus` ever fires on markup this file owns, this
     * still fails.
     *
     * This subtraction stays FILE-LOCAL on purpose. Hoisting it into `./axe`
     * would exempt every other suite from a rule they should still be held to.
     */
    const isRadixModalMachinery = (html: string) =>
      html.includes('radix-focus-guard') || html.includes('data-aria-hidden');

    const ours = violations
      .map((v) => ({ ...v, nodes: v.nodes.filter((n) => !isRadixModalMachinery(n.html)) }))
      .filter((v) => v.nodes.length > 0);

    expect(
      ours.length,
      ours
        .map((v) => `${v.id}: ${v.help}\n    ${v.nodes.map((n) => n.html).join('\n    ')}`)
        .join('\n  '),
    ).toBe(0);

    // The subtraction above must stay narrow: nothing but the guards, and
    // nothing but that one rule.
    expect(violations.map((v) => v.id).filter((id) => id !== 'aria-hidden-focus')).toEqual([]);
    expect(container).toBeTruthy();
  });

  it('labels the menu from its trigger', async () => {
    render(<Basic />);
    await openMenu();
    expect(screen.getByRole('menu').getAttribute('aria-labelledby')).toBe(getTrigger().id);
  });
});
