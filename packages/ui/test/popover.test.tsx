import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Button } from '../../../registry/velobits/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
  DialogTrigger,
} from '../../../registry/velobits/ui/dialog';
import { Input } from '../../../registry/velobits/ui/input';
import { Label } from '../../../registry/velobits/ui/label';
import {
  Popover,
  PopoverAnchor,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from '../../../registry/velobits/ui/popover';
import { auditElement } from './axe';

/**
 * This suite audits with `auditElement` rooted at the portalled panel. A popover
 * is not modal, so the document is not `aria-hidden`ed the way a dialog's is — but
 * scoping keeps the run about the panel and matches the dialog and side-panel
 * suites.
 */

function FilterPopover(props: Omit<React.ComponentProps<typeof PopoverContent>, 'children'>) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button>Filter</Button>
      </PopoverTrigger>
      <PopoverContent {...props}>
        <PopoverHeader>
          <PopoverTitle>Filter flags</PopoverTitle>
          <PopoverDescription>Matches key and description.</PopoverDescription>
        </PopoverHeader>
        <div>
          <Label htmlFor="q">Query</Label>
          <Input id="q" />
        </div>
      </PopoverContent>
    </Popover>
  );
}

async function open() {
  await userEvent.click(screen.getByRole('button', { name: 'Filter' }));
  const panel = await waitFor(() => document.querySelector('[data-slot="popover-content"]'));
  expect(panel).not.toBeNull();
  return panel!;
}

describe('Popover', () => {
  it('opens from its trigger and reports open state on both parts', async () => {
    render(<FilterPopover />);
    const panel = await open();
    expect(panel.getAttribute('data-state')).toBe('open');
    expect(screen.getByRole('button', { name: 'Filter' }).getAttribute('aria-expanded')).toBe(
      'true',
    );
  });

  it('closes on Escape and returns focus to the trigger', async () => {
    render(<FilterPopover />);
    await open();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(document.querySelector('[data-slot="popover-content"]')).toBeNull());
    expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Filter' }));
  });

  it('closes on an outside pointer press', async () => {
    render(
      <div>
        <FilterPopover />
        <Button>Elsewhere</Button>
      </div>,
    );
    await open();
    await userEvent.click(screen.getByRole('button', { name: 'Elsewhere' }));
    await waitFor(() => expect(document.querySelector('[data-slot="popover-content"]')).toBeNull());
  });

  it('accepts an anchor separate from the trigger', async () => {
    /** A row anchors the popper while the kebab button inside it stays the trigger. */
    render(
      <Popover>
        <PopoverAnchor asChild>
          <div data-testid="row">
            <PopoverTrigger asChild>
              <Button>Filter</Button>
            </PopoverTrigger>
          </div>
        </PopoverAnchor>
        <PopoverContent>
          <PopoverTitle>Filter flags</PopoverTitle>
        </PopoverContent>
      </Popover>,
    );
    expect(screen.getByTestId('row').getAttribute('data-slot')).toBe('popover-anchor');
    const panel = await open();
    expect(panel.getAttribute('data-state')).toBe('open');
  });

  it('renders the hand-rolled Header/Title/Description trio as div/h2/p', async () => {
    /**
     * Radix Popover has no `Title` or `Description` parts to wire — it is not a
     * labelled region — so these are ours. ToggleFlow's copy typed `PopoverTitle`
     * as `'h2'` props while rendering a `div`, which left the heading invisible to
     * a screen reader's heading list. Kept at the same names and `data-slot`s so
     * its call sites migrate without edits.
     */
    render(<FilterPopover />);
    const panel = await open();
    expect(panel.querySelector('[data-slot="popover-header"]')!.tagName).toBe('DIV');
    expect(panel.querySelector('[data-slot="popover-title"]')!.tagName).toBe('H2');
    expect(panel.querySelector('[data-slot="popover-description"]')!.tagName).toBe('P');
    expect(screen.getByRole('heading', { name: 'Filter flags' })).toBeTruthy();
  });
});

describe('Popover naming', () => {
  it('names the panel from PopoverTitle, because Radix gives it role=dialog', async () => {
    /**
     * Radix Popover's content is a `role="dialog"` with no `Title` part, so unlike
     * Radix Dialog it never sets `aria-labelledby` — the panel is announced as bare
     * "dialog" and the heading is only found once the user is already inside it.
     * axe reports it as `aria-dialog-name`; ToggleFlow's copy ships it today.
     */
    render(<FilterPopover />);
    const panel = await open();
    const titleId = panel.querySelector('[data-slot="popover-title"]')!.id;
    expect(titleId).toBeTruthy();
    expect(panel.getAttribute('aria-labelledby')).toBe(titleId);
    expect(screen.getByRole('dialog', { name: 'Filter flags' })).toBe(panel);
  });

  it('references the title id the caller supplied, not the generated one', async () => {
    /** Otherwise a caller adding their own `id` silently creates a dangling ref. */
    render(
      <Popover>
        <PopoverTrigger asChild>
          <Button>Filter</Button>
        </PopoverTrigger>
        <PopoverContent>
          <PopoverTitle id="my-title">Filter flags</PopoverTitle>
        </PopoverContent>
      </Popover>,
    );
    const panel = await open();
    expect(panel.getAttribute('aria-labelledby')).toBe('my-title');
    expect(document.getElementById('my-title')).toBeTruthy();
  });

  it('leaves aria-labelledby off entirely when there is no title', async () => {
    /**
     * A bare form popover is legitimate. Pointing `aria-labelledby` at an id that
     * never renders would be worse than no name: the accessible name resolves to
     * the empty string, and axe reports it as an invalid attribute value.
     */
    render(
      <Popover>
        <PopoverTrigger asChild>
          <Button>Filter</Button>
        </PopoverTrigger>
        <PopoverContent aria-label="Filter flags">
          <Label htmlFor="q2">Query</Label>
          <Input id="q2" />
        </PopoverContent>
      </Popover>,
    );
    const panel = await open();
    expect(panel.getAttribute('aria-labelledby')).toBeNull();
    const violations = await auditElement(panel);
    expect(violations.length, violations.map((v) => `${v.id}: ${v.help}`).join('\n')).toBe(0);
  });

  it("lets a caller's own aria-labelledby win", async () => {
    render(
      <div>
        <h1 id="outside">Flags</h1>
        <Popover>
          <PopoverTrigger asChild>
            <Button>Filter</Button>
          </PopoverTrigger>
          <PopoverContent aria-labelledby="outside">
            <PopoverTitle>Filter flags</PopoverTitle>
          </PopoverContent>
        </Popover>
      </div>,
    );
    expect((await open()).getAttribute('aria-labelledby')).toBe('outside');
  });
});

describe('Popover glass tier', () => {
  it('uses the elevated tier, which is what glass-on-glass needs', async () => {
    /**
     * Plain overlay glass over overlay glass compounds into a milky panel with no
     * readable edge between the layers, and in dark mode a chromatic tint at the
     * base alpha drifts visibly green over the lime brand fill. `.glass-elevated`
     * is the plum-tinted, higher-alpha step for exactly this case.
     */
    render(<FilterPopover />);
    const cls = (await open()).className;
    expect(cls).toContain('glass');
    expect(cls).toContain('glass-elevated');
  });

  it('adds no background utility that would replace the glass background', async () => {
    /**
     * `.glass` lives in Tailwind's `components` layer, so a `bg-*` utility on the
     * same element wins outright. Stock shadcn's popover ships `bg-popover`, which
     * is precisely the class that must not survive the migration.
     */
    render(<FilterPopover />);
    const cls = (await open()).className;
    expect(cls).not.toMatch(/\bbg-/);
  });

  it('animates opacity, scale and a 2px slide — never the blur radius', async () => {
    render(<FilterPopover />);
    const cls = (await open()).className;
    expect(cls).toContain('data-[state=open]:zoom-in-95');
    expect(cls).toContain('data-[side=bottom]:slide-in-from-top-2');
    expect(cls).not.toMatch(/blur-(in|out)/);
    expect(cls).not.toMatch(/animate-\[[^\]]*(width|height)/);
  });

  it('scales out of the trigger, using the origin Radix computes', async () => {
    /** Including after a collision flip, which a fixed `origin-center` would not. */
    render(<FilterPopover />);
    expect((await open()).className).toContain('origin-(--radix-popover-content-transform-origin)');
  });

  it('uses the 180ms enter step, set through the variable the shorthand reads', async () => {
    /**
     * Not the 240ms overlay step: a popover travels a few pixels from a control the
     * user is already looking at, and the longer curve reads as lag. And not the
     * `duration-enter` utility — `animate-in` expands to the `animation` SHORTHAND,
     * which behind a `data-[state=…]` variant outranks a bare `animation-duration`
     * longhand on order and specificity. `--tw-animation-duration` is the variable
     * the shorthand itself reads.
     */
    render(<FilterPopover />);
    const cls = (await open()).className;
    expect(cls).toContain('animation-duration-(--duration-enter)');
    expect(cls.replace('animation-duration-(--duration-enter)', '')).not.toContain(
      'duration-enter',
    );
  });
});

describe('Popover inside a Dialog', () => {
  /**
   * The documented elevated-tier case, and the reason `PopoverContent` portals.
   *
   * `backdrop-filter` forms a stacking context, so `z-index` inside a glass
   * surface is scoped to it — a popover rendered *within* `DialogContent` could
   * never rise above the dialog whatever `z-popover` said. It also establishes a
   * containing block for `position: fixed` descendants, so Radix's popper would be
   * positioned against the dialog and clipped by it.
   */
  function DialogWithPopover() {
    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button>Edit rule</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogTitle>Edit rule</DialogTitle>
          <DialogDescription>Target a segment.</DialogDescription>
          <Popover>
            <PopoverTrigger asChild>
              <Button>Filter</Button>
            </PopoverTrigger>
            <PopoverContent>
              <PopoverTitle>Filter flags</PopoverTitle>
            </PopoverContent>
          </Popover>
        </DialogContent>
      </Dialog>
    );
  }

  it('escapes the dialog panel by portalling to the body', async () => {
    render(<DialogWithPopover />);
    await userEvent.click(screen.getByRole('button', { name: 'Edit rule' }));
    const dialog = screen.getByRole('dialog', { name: 'Edit rule' });
    const panel = await open();
    expect(dialog.contains(panel)).toBe(false);
    expect(document.body.contains(panel)).toBe(true);
  });

  it('sits on the z-index rung above the dialog', async () => {
    render(<DialogWithPopover />);
    await userEvent.click(screen.getByRole('button', { name: 'Edit rule' }));
    const dialog = screen.getByRole('dialog', { name: 'Edit rule' });
    const panel = await open();
    // z-popover (1300) over z-modal (1200) over z-overlay (1100).
    expect(panel.className).toContain('z-popover');
    expect(dialog.className).toContain('z-modal');
  });
});

describe('Popover accessibility', () => {
  it('passes axe with a header and a field', async () => {
    render(<FilterPopover />);
    const violations = await auditElement(await open());
    expect(violations.length, violations.map((v) => `${v.id}: ${v.help}`).join('\n')).toBe(0);
  });
});
