import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { Button } from '../../../registry/velobits/ui/button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../../../registry/velobits/ui/dialog';
import { Input } from '../../../registry/velobits/ui/input';
import { Label } from '../../../registry/velobits/ui/label';
import { auditElement } from './axe';

/**
 * This suite audits with `auditElement` scoped to the portalled PANEL instead of
 * to `document.body`.
 *
 * Auditing the whole document trips `aria-hidden-focus` on the trigger: a modal
 * Radix dialog marks every other body child `aria-hidden`, and the trigger inside
 * one is still tabbable as far as axe can tell. `FocusScope` is what actually
 * prevents reaching it, and no static rule can see that. Rooting the run at the
 * panel keeps the assertion about the panel — which is the part this component
 * owns — and still covers `aria-dialog-name`, so a missing `DialogTitle` fails
 * here rather than in a console warning nobody reads.
 */

/** The canonical form dialog: header, one field, Cancel + submit. */
function FormDialog(props: Omit<React.ComponentProps<typeof DialogContent>, 'children'>) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>New environment</Button>
      </DialogTrigger>
      <DialogContent {...props}>
        <DialogHeader>
          <DialogTitle>New environment</DialogTitle>
          <DialogDescription>New environments inherit from Production.</DialogDescription>
        </DialogHeader>
        <div>
          <Label htmlFor="env-key">Key</Label>
          <Input id="env-key" />
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button>Cancel</Button>
          </DialogClose>
          <Button variant="primary">Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

async function open() {
  await userEvent.click(screen.getByRole('button', { name: 'New environment' }));
  return screen.getByRole('dialog', { name: 'New environment' });
}

/** The body-level subtree an element sits in — what Radix hides, or does not. */
function bodyBranchOf(el: Element) {
  let node: Element = el;
  while (node.parentElement && node.parentElement !== document.body) node = node.parentElement;
  return node;
}

describe('Dialog', () => {
  it('opens from its trigger, named from its title', async () => {
    render(<FormDialog />);
    /*
     * `open()` looks the dialog up BY its accessible name, so getting a node back
     * at all is the assertion: the name comes from `DialogTitle`, and Radix
     * produces no name whatsoever without one.
     */
    const dialog = await open();
    expect(dialog.getAttribute('role')).toBe('dialog');
    expect(dialog.querySelector('[data-slot="dialog-title"]')!.textContent).toBe('New environment');
  });

  it('goes modal by hiding the rest of the document, not with aria-modal', async () => {
    /**
     * Worth pinning because it is the opposite of what most people assert. Radix
     * sets no `aria-modal` — support for it is uneven and it does nothing about a
     * screen reader's virtual cursor. It marks every OTHER body-level subtree
     * `aria-hidden` instead, which is also why the axe run in this file is scoped
     * to the panel rather than to the document.
     */
    render(<FormDialog />);
    const trigger = screen.getByRole('button', { name: 'New environment' });
    const dialog = await open();
    expect(dialog.getAttribute('aria-modal')).toBeNull();
    expect(bodyBranchOf(trigger).getAttribute('aria-hidden')).toBe('true');
    expect(bodyBranchOf(dialog).getAttribute('aria-hidden')).toBeNull();
  });

  it('closes on Escape', async () => {
    render(<FormDialog />);
    await open();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('closes from the ✕ and from a DialogClose in the footer', async () => {
    render(<FormDialog />);
    await open();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    await open();
    await userEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('restores focus to the trigger on close', async () => {
    /**
     * The half of a focus trap that gets forgotten: a keyboard user who Escapes
     * out of a dialog and lands back at the top of the document has lost their
     * place in the page.
     */
    render(<FormDialog />);
    const trigger = screen.getByRole('button', { name: 'New environment' });
    await open();
    expect(document.activeElement).not.toBe(trigger);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it('traps focus inside the panel in both directions', async () => {
    render(<FormDialog />);
    const dialog = await open();

    screen.getByRole('button', { name: 'Create' }).focus();
    await userEvent.tab();
    expect(dialog.contains(document.activeElement)).toBe(true);

    screen.getByRole('button', { name: 'Close' }).focus();
    await userEvent.tab({ shift: true });
    expect(dialog.contains(document.activeElement)).toBe(true);
  });
});

/**
 * ## What this block can and cannot prove (the consumer ADR)
 *
 * The behaviour `focusFirstField` exists for — Radix's `FocusScope` focusing the
 * first tabbable node and beating a field's `autoFocus` — is a RACE between
 * React's autofocus commit and the scope's mount effect, and happy-dom with React
 * 19 resolves it the other way round: `autoFocus` appears to work here, and does
 * not in Chrome, which is where the dashboard app met it on "New environment".
 *
 * So there is deliberately no "autoFocus is ignored" test. Writing one would pin
 * an environment quirk and would go green through a regression. What IS asserted
 * is the contract that replaces `autoFocus` in the first place: default focus
 * lands on the ✕, `focusFirstField` moves it to the first enabled field, and a
 * caller can take the decision over. Those three hold identically in both
 * environments, which is the whole reason the fix is an explicit prop rather than
 * a trusted `autoFocus`.
 */
describe('Dialog initial focus', () => {
  it('lands on the ✕ by default, never silently in a field', async () => {
    render(<FormDialog />);
    await open();
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close' })),
    );
    expect(document.activeElement).not.toBe(screen.getByLabelText('Key'));
  });

  it('redirects to the first field with focusFirstField', async () => {
    render(<FormDialog focusFirstField />);
    await open();
    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText('Key')));
  });

  it('skips hidden and disabled inputs when redirecting', async () => {
    render(
      <Dialog>
        <DialogTrigger asChild>
          <Button>New environment</Button>
        </DialogTrigger>
        <DialogContent focusFirstField>
          <DialogHeader>
            <DialogTitle>New environment</DialogTitle>
            <DialogDescription>Pick a key.</DialogDescription>
          </DialogHeader>
          <input type="hidden" name="csrf" defaultValue="x" />
          <Input aria-label="Locked" disabled />
          <Input aria-label="Key" />
        </DialogContent>
      </Dialog>,
    );
    await open();
    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText('Key')));
  });

  it('leaves Radix alone when there is no field to redirect to', async () => {
    /** The reveal-once API key dialog: nothing to type into, so nothing to move. */
    render(
      <Dialog>
        <DialogTrigger asChild>
          <Button>New environment</Button>
        </DialogTrigger>
        <DialogContent focusFirstField>
          <DialogHeader>
            <DialogTitle>New environment</DialogTitle>
            <DialogDescription>Copy this key now.</DialogDescription>
          </DialogHeader>
          <code>sk_live_…</code>
        </DialogContent>
      </Dialog>,
    );
    const dialog = await open();
    await waitFor(() => expect(dialog.contains(document.activeElement)).toBe(true));
  });

  it("lets a caller's own onOpenAutoFocus opt out by preventing the default", async () => {
    /** How the scope switcher focuses its filter box instead of the first field. */
    const onOpenAutoFocus = vi.fn((event: Event) => {
      event.preventDefault();
      document.getElementById('filter')?.focus();
    });
    render(
      <Dialog>
        <DialogTrigger asChild>
          <Button>New environment</Button>
        </DialogTrigger>
        <DialogContent focusFirstField onOpenAutoFocus={onOpenAutoFocus}>
          <DialogHeader>
            <DialogTitle>New environment</DialogTitle>
            <DialogDescription>Pick a key.</DialogDescription>
          </DialogHeader>
          <Input aria-label="Key" />
          <Input aria-label="Filter" id="filter" />
        </DialogContent>
      </Dialog>,
    );
    await open();
    expect(onOpenAutoFocus).toHaveBeenCalledOnce();
    await waitFor(() => expect(document.activeElement).toBe(screen.getByLabelText('Filter')));
  });
});

describe('Dialog glass and layout invariants', () => {
  it('is the overlay glass tier, with no background utility to override it', async () => {
    /**
     * `.glass` lives in Tailwind's `components` layer, so ANY `bg-*` utility on
     * the same element wins and replaces the glass background with a flat fill —
     * silently, and only visibly wrong once there is content behind the dialog.
     */
    render(<FormDialog />);
    const cls = (await open()).className;
    expect(cls).toContain('glass');
    expect(cls).not.toMatch(/\bbg-/);
  });

  it('dims with the --overlay scrim rather than a second blur', async () => {
    render(<FormDialog />);
    await open();
    const cls = document.querySelector('[data-slot="dialog-overlay"]')!.className;
    expect(cls).toContain('bg-overlay');
    expect(cls).not.toMatch(/blur/);
  });

  it('centres with auto margins, not a physical translate', async () => {
    /**
     * Two bugs avoided at once: `left-1/2` is physical and wrong under
     * `dir="rtl"`, and `tw-animate-css`'s keyframes write the WHOLE `transform`
     * property — so a layout `-translate-x-1/2` is discarded for the length of
     * the animation, which is the off-centre jump stock shadcn dialogs do on open.
     */
    render(<FormDialog />);
    const cls = (await open()).className;
    expect(cls).toContain('m-auto');
    expect(cls).toContain('inset-0');
    expect(cls).not.toMatch(/\b-?translate-x-/);
    expect(cls).not.toMatch(/\bleft-|\bright-/);
  });

  it('animates opacity and scale only, never the blur radius', async () => {
    render(<FormDialog />);
    const cls = (await open()).className;
    expect(cls).toContain('data-[state=open]:zoom-in-95');
    expect(cls).toContain('data-[state=closed]:animate-out');
    // Animating the blur radius forces a full backdrop repaint every frame.
    expect(cls).not.toMatch(/blur-(in|out)/);
    // Width/height animation relayouts the subtree and re-samples the backdrop.
    expect(cls).not.toMatch(/animate-\[[^\]]*(width|height)/);
  });

  it('sets the animation duration through the variable the shorthand reads', async () => {
    /**
     * `animate-in` expands to the `animation` SHORTHAND. Behind a
     * `data-[state=…]` variant it outranks a bare `animation-duration` longhand
     * on both order and specificity, so the `duration-overlay` token utility
     * would be dropped without a word. `--tw-animation-duration` is the variable
     * the shorthand itself reads, and `animation-duration-*` is what sets it.
     */
    render(<FormDialog />);
    const cls = (await open()).className;
    expect(cls).toContain('animation-duration-(--duration-overlay)');
    expect(cls.replace('animation-duration-(--duration-overlay)', '')).not.toContain(
      'duration-overlay',
    );
  });

  it('keeps the ✕ absolute, so it is not trapped by the glass containing block', async () => {
    /**
     * `backdrop-filter` establishes a containing block for `position: fixed`
     * descendants. A fixed child of `.glass` is positioned against the dialog and
     * cannot escape it, which looks like a z-index bug and is not one.
     */
    render(<FormDialog />);
    await open();
    const cls = screen.getByRole('button', { name: 'Close' }).className;
    expect(cls).toContain('absolute');
    expect(cls).not.toMatch(/\bfixed\b/);
    // Logical inset, so it flips with the header's padding under dir="rtl".
    expect(cls).toContain('end-3');
  });

  it('sizes to ~480px by default and lets a caller override it', async () => {
    const { unmount } = render(<FormDialog />);
    expect((await open()).className).toContain('max-w-[30rem]');
    unmount();

    render(<FormDialog size="lg" className="max-w-[70rem]" />);
    const cls = (await open()).className;
    // cn() is twMerge-based: the caller's max-width replaces the variant's.
    expect(cls).toContain('max-w-[70rem]');
    expect(cls).not.toContain('max-w-[42rem]');
  });

  it('can drop the ✕ for a dialog that demands an explicit choice', async () => {
    render(<FormDialog showCloseButton={false} />);
    await open();
    expect(screen.queryByRole('button', { name: 'Close' })).toBeNull();
  });
});

describe('Dialog accessibility', () => {
  it('passes axe with a header, a field and a footer', async () => {
    render(<FormDialog />);
    const violations = await auditElement(await open());
    expect(violations.length, violations.map((v) => `${v.id}: ${v.help}`).join('\n')).toBe(0);
  });

  it('passes axe with the focus redirect enabled', async () => {
    render(<FormDialog focusFirstField />);
    const violations = await auditElement(await open());
    expect(violations.length, violations.map((v) => `${v.id}: ${v.help}`).join('\n')).toBe(0);
  });
});
