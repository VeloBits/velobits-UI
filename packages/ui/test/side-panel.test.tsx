import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { Button } from '../../../registry/velobits/ui/button';
import { Input } from '../../../registry/velobits/ui/input';
import { Label } from '../../../registry/velobits/ui/label';
import {
  SidePanel,
  SidePanelClose,
  SidePanelContent,
  SidePanelDescription,
  SidePanelFooter,
  SidePanelHeader,
  SidePanelTitle,
  SidePanelTrigger,
} from '../../../registry/velobits/ui/side-panel';
import { auditElement } from './axe';

/**
 * This suite audits with `auditElement` rooted at the portalled panel rather than
 * at `document.body` , a modal Radix dialog marks the rest of the document
 * `aria-hidden` while its trigger stays tabbable, which trips `aria-hidden-focus`
 * on a mechanism `FocusScope` already handles and no static rule can see.
 */

/**
 * A detail sheet that also happens to contain a field , the shape that makes the
 * the consumer ADR assertions meaningful, because it is where a focus redirect would be
 * *possible* and must not happen.
 */
function DetailPanel(props: Omit<React.ComponentProps<typeof SidePanelContent>, 'children'>) {
  return (
    <SidePanel>
      <SidePanelTrigger asChild>
        <Button>View flag</Button>
      </SidePanelTrigger>
      <SidePanelContent {...props}>
        <SidePanelHeader>
          <SidePanelTitle>checkout-v2</SidePanelTitle>
          <SidePanelDescription>Production · 40% rollout</SidePanelDescription>
        </SidePanelHeader>
        <div>
          <Label htmlFor="note">Note</Label>
          <Input id="note" />
        </div>
        <SidePanelFooter>
          <SidePanelClose asChild>
            <Button>Done</Button>
          </SidePanelClose>
        </SidePanelFooter>
      </SidePanelContent>
    </SidePanel>
  );
}

async function open() {
  await userEvent.click(screen.getByRole('button', { name: 'View flag' }));
  return screen.getByRole('dialog', { name: 'checkout-v2' });
}

/**
 * A registry component's source with its comments removed.
 *
 * Both docblocks talk about `onOpenAutoFocus` and `focusFirstField` at length ,
 * that is the documentation of the split , so a plain substring search over the
 * raw file can only ever match the prose. Stripping comments is what makes the
 * assertion about the CODE.
 */
function codeOf(component: 'dialog' | 'side-panel') {
  return readFileSync(join(process.cwd(), `../../registry/velobits/ui/${component}.tsx`), 'utf8')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/^\s*\/\/.*$/gm, '');
}

describe('SidePanel', () => {
  it('opens from its trigger, named from its title', async () => {
    render(<DetailPanel />);
    const panel = await open();
    expect(panel.getAttribute('role')).toBe('dialog');
    expect(panel.getAttribute('data-side')).toBe('right');
  });

  it('closes on Escape', async () => {
    render(<DetailPanel />);
    await open();
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('closes from the ✕ and from a SidePanelClose', async () => {
    render(<DetailPanel />);
    await open();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());

    await open();
    await userEvent.click(screen.getByRole('button', { name: 'Done' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });

  it('restores focus to the trigger on close', async () => {
    render(<DetailPanel />);
    const trigger = screen.getByRole('button', { name: 'View flag' });
    await open();
    expect(document.activeElement).not.toBe(trigger);
    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it('traps focus inside the panel in both directions', async () => {
    render(<DetailPanel />);
    const panel = await open();

    screen.getByRole('button', { name: 'Done' }).focus();
    await userEvent.tab();
    expect(panel.contains(document.activeElement)).toBe(true);

    screen.getByRole('button', { name: 'Close' }).focus();
    await userEvent.tab({ shift: true });
    expect(panel.contains(document.activeElement)).toBe(true);
  });
});

/**
 * ## The the consumer ADR split, asserted rather than commented
 *
 * `Dialog` is the ~480px centred FORM box and it offers `focusFirstField`.
 * `SidePanel` is the edge-anchored READING sheet and it keeps Radix's default ,
 * the first tabbable node, which is the ✕. A reading sheet that yanks focus into
 * the first field scrolls itself, pops the mobile keyboard, and drops a
 * screen-reader user into the middle of the content instead of at its heading.
 *
 * The two were split so that neither behaviour has to be conditional. These tests
 * exist because a future "these are nearly the same component" refactor would
 * merge them, pick one focus policy, and break half the call sites , with nothing
 * failing.
 */
describe('SidePanel does not redirect focus (the consumer ADR)', () => {
  it('leaves initial focus on the ✕ even when the panel contains a field', async () => {
    render(<DetailPanel />);
    await open();
    await waitFor(() =>
      expect(document.activeElement).toBe(screen.getByRole('button', { name: 'Close' })),
    );
    expect(document.activeElement).not.toBe(screen.getByLabelText('Note'));
  });

  it('has no focus-redirect machinery in its source at all', () => {
    /**
     * The runtime assertion above passes for a panel with no `showCloseButton`
     * too, so on its own it would not notice a redirect added behind a default-off
     * prop. This one does.
     */
    expect(codeOf('side-panel')).not.toContain('onOpenAutoFocus');
    expect(codeOf('side-panel')).not.toContain('focusFirstField');
  });

  it('is the only one of the pair without it, which is the split itself', () => {
    // If this ever fails, the two were merged and the consumer ADR needs revisiting first.
    expect(codeOf('dialog')).toContain('focusFirstField');
    expect(codeOf('dialog')).toContain('onOpenAutoFocus');
  });
});

describe('SidePanel sides', () => {
  it('anchors to the inline edges with logical properties, never left/right', async () => {
    /**
     * `right` means INLINE-END here, so the sheet attaches to the left edge under
     * `dir="rtl"` , which is where a reader in an RTL locale expects it. A
     * physical `right-0` would not move, and neither would a physical slide.
     */
    render(<DetailPanel />);
    const cls = (await open()).className;
    expect(cls).toContain('end-0');
    expect(cls).not.toMatch(/\bright-0|\bleft-0/);
  });

  it('slides in from the edge it is anchored to, in either direction', async () => {
    /**
     * `slide-in-from-right` is physical: paired with a logical `end-0` anchor it
     * flies in from the opposite side of the screen under RTL. `tw-animate-css`
     * ≥1.4's `slide-in-from-end` is implemented with `:dir()`, so anchor and
     * animation agree without a mirrored `rtl:` duplicate whose stylesheet order
     * would silently decide the winner.
     */
    render(<DetailPanel />);
    const cls = (await open()).className;
    expect(cls).toContain('data-[state=open]:slide-in-from-end');
    expect(cls).toContain('data-[state=closed]:slide-out-to-end');
    expect(cls).not.toMatch(/slide-(in|out)-(from|to)-(left|right)/);
  });

  it('mirrors to the inline-start edge for side="left"', async () => {
    render(<DetailPanel side="left" />);
    const cls = (await open()).className;
    expect(cls).toContain('start-0');
    expect(cls).toContain('data-[state=open]:slide-in-from-start');
    expect(cls).not.toContain('end-0');
  });

  it('gives the bottom sheet a DEFINITE height in dvh, not a percentage', async () => {
    /**
     * the editor app's mobile-IA constraint. `h-[75%]` resolves against a
     * fixed-position containing block that is not always what you expect, and
     * `max-h` with an auto height leaves an inner `flex-1`/`min-h-0` scroll region
     * nothing to measure , the sheet then either collapses to its content or
     * refuses to scroll. `dvh` also tracks mobile browser chrome, which `vh` does
     * not: with `vh` the bottom of the sheet sits under iOS's URL bar.
     */
    render(<DetailPanel side="bottom" />);
    const cls = (await open()).className;
    expect(cls).toContain('h-[75dvh]');
    expect(cls).not.toMatch(/h-\[\d+%\]/);
    expect(cls).not.toMatch(/h-\[\d+vh\]/);
    expect(cls).toContain('data-[state=open]:slide-in-from-bottom');
  });
});

describe('SidePanel glass and animation invariants', () => {
  it('is the overlay glass tier, with no background utility to override it', async () => {
    /**
     * `.glass` sits in Tailwind's `components` layer, so any `bg-*` utility on the
     * same element replaces the glass background with a flat fill , silently.
     */
    render(<DetailPanel />);
    const cls = (await open()).className;
    expect(cls).toContain('glass');
    expect(cls).not.toMatch(/\bbg-/);
  });

  it('dims with the --overlay scrim and does not blur it a second time', async () => {
    render(<DetailPanel />);
    await open();
    const cls = document.querySelector('[data-slot="side-panel-overlay"]')!.className;
    expect(cls).toContain('bg-overlay');
    expect(cls).not.toMatch(/blur/);
  });

  it('animates transform and opacity only , never width, height or blur', async () => {
    /**
     * Width/height animation relayouts the whole subtree every frame and, on a
     * glass surface, re-samples the backdrop with it. Animating the blur RADIUS
     * costs the same at every pixel.
     */
    render(<DetailPanel />);
    const cls = (await open()).className;
    expect(cls).toMatch(/slide-(in|out)-(from|to)-end/);
    expect(cls).not.toMatch(/blur-(in|out)/);
    expect(cls).not.toMatch(/animate-\[[^\]]*(width|height)/);
    expect(cls).not.toMatch(/transition-\[[^\]]*(width|height)/);
  });

  it('sets the animation duration through the variable the shorthand reads', async () => {
    /** See dialog.test.tsx , `animate-in` is the `animation` shorthand. */
    render(<DetailPanel />);
    const cls = (await open()).className;
    expect(cls).toContain('animation-duration-(--duration-overlay)');
    expect(cls.replace('animation-duration-(--duration-overlay)', '')).not.toContain(
      'duration-overlay',
    );
  });

  it('keeps the ✕ absolute, so the glass containing block cannot trap it', async () => {
    /**
     * `backdrop-filter` establishes a containing block for `position: fixed`
     * descendants , a fixed child of `.glass` is positioned against the panel and
     * cannot escape it. The same applies to any sticky footer a caller adds, which
     * is why `SidePanelFooter` uses `mt-auto`.
     */
    render(<DetailPanel />);
    await open();
    const cls = screen.getByRole('button', { name: 'Close' }).className;
    expect(cls).toContain('absolute');
    expect(cls).not.toMatch(/\bfixed\b/);
    expect(cls).toContain('end-4');

    const footer = document.querySelector('[data-slot="side-panel-footer"]')!.className;
    expect(footer).toContain('mt-auto');
    expect(footer).not.toMatch(/\bsticky\b/);
  });

  it('does not scroll itself, so the ✕ stays reachable and mt-auto works', async () => {
    /**
     * The scroll region belongs on a child. Put it on the panel and the ✕ ,
     * positioned against this box , scrolls out of reach, and the footer's
     * `mt-auto` has a column that grows with its content instead of a fixed one.
     */
    render(<DetailPanel />);
    const cls = (await open()).className;
    expect(cls).toContain('overflow-hidden');
    expect(cls).not.toContain('overflow-y-auto');
  });
});

describe('SidePanel accessibility', () => {
  it('passes axe as a right-anchored reading sheet', async () => {
    render(<DetailPanel />);
    const violations = await auditElement(await open());
    expect(violations.length, violations.map((v) => `${v.id}: ${v.help}`).join('\n')).toBe(0);
  });

  it('passes axe as a bottom sheet', async () => {
    render(<DetailPanel side="bottom" />);
    const violations = await auditElement(await open());
    expect(violations.length, violations.map((v) => `${v.id}: ${v.help}`).join('\n')).toBe(0);
  });
});
