import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { CircleCheckIcon, ZapIcon } from '@velobitsio/icons';

import { STATUS_ORDER, StatusChip, type Status } from '../../../registry/velobits/ui/status-chip';
import { audit } from './axe';

const ALL: Status[] = ['on', 'off', 'partial', 'pending', 'archived'];

describe('StatusChip, the second channel', () => {
  it('gives every status an icon as well as a colour', () => {
    /**
     * WCAG 1.4.1. Around 8% of men have a red/green deficiency, and on-versus-off
     * is the single most consequential distinction this system makes , a chip
     * carrying only a colour conveys nothing to one reader in twelve.
     */
    for (const status of ALL) {
      const { container, unmount } = render(<StatusChip status={status} />);
      const chip = container.querySelector('[data-slot="status-chip"]')!;
      expect(chip.querySelector('svg'), `${status} has no glyph`).not.toBeNull();
      unmount();
    }
  });

  it('gives each status a DISTINCT glyph, not the same one recoloured', () => {
    /** A shared glyph is the same failure with an extra step. */
    const paths = ALL.map((status) => {
      const { container, unmount } = render(<StatusChip status={status} />);
      const d = container.querySelector('svg')!.innerHTML;
      unmount();
      return d;
    });
    // `archived` and the rest must all differ from one another.
    expect(new Set(paths).size).toBe(ALL.length);
  });

  it('leaves the glyph out of the accessibility tree', () => {
    /** The label carries the meaning; the icon is for sighted readers. */
    const { container } = render(<StatusChip status="on" />);
    expect(container.querySelector('svg')!.getAttribute('aria-hidden')).toBe('true');
  });
});

describe('StatusChip, labelling', () => {
  it('puts sentence case in the DOM and uppercases with CSS', () => {
    /**
     * Some screen readers spell a short all-caps token letter by letter , "oh
     * en". `text-transform` changes the glyphs only, so the accessible name stays
     * the word.
     */
    const { container } = render(<StatusChip status="on" />);
    const chip = container.querySelector('[data-slot="status-chip"]')!;
    expect(chip.textContent).toBe('On');
    expect(chip.textContent).not.toBe('ON');
    expect(chip.className).toContain('uppercase');
  });

  it('lets children replace the word , a rollout shows its percentage', () => {
    render(<StatusChip status="partial">25%</StatusChip>);
    expect(screen.getByText('25%')).toBeTruthy();
  });

  it('uppercases a children override too, and every other test here hides that', () => {
    /**
     * `uppercase` sits on the chip, not on the built-in words, so it paints the
     * override as well: `Rolling out` reads `ROLLING OUT`.
     *
     * Worth its own case because the rest of this suite cannot see it. The
     * override was designed for a percentage, so every other assertion passes
     * `25%` , digits are case-invariant, which is exactly the class of value that
     * cannot reveal a text-transform. A word can.
     */
    const { container, unmount } = render(<StatusChip status="partial">Rolling out</StatusChip>);
    const chip = container.querySelector('[data-slot="status-chip"]')!;
    // The DOM keeps the case, so the announcement is still the words.
    expect(chip.textContent).toBe('Rolling out');
    expect(chip.className).toContain('uppercase');
    unmount();

    // And the documented escape, which has to actually win the merge.
    const { container: plain } = render(
      <StatusChip status="partial" className="normal-case">
        Rolling out
      </StatusChip>,
    );
    const cls = plain.querySelector('[data-slot="status-chip"]')!.className;
    expect(cls).toContain('normal-case');
    expect(cls).not.toMatch(/\buppercase\b/);
  });

  it('uses tabular figures so a polling column does not ripple', () => {
    const { container } = render(<StatusChip status="partial">25%</StatusChip>);
    expect(container.querySelector('[data-slot="status-chip"]')!.className).toContain(
      'tabular-nums',
    );
  });

  it('exposes the status as a data attribute for a caller to target', () => {
    const { container } = render(<StatusChip status="archived" />);
    expect(container.querySelector('[data-status="archived"]')).not.toBeNull();
  });
});

describe('StatusChip, palette reuse', () => {
  it('maps each status onto a Badge variant rather than hand-rolling the wash', () => {
    /**
     * The `bg-*-soft` / `text-*` pairs are Badge's, and they are gated there. A
     * second set of literals here is how the two drift.
     */
    const expected: Record<Status, string> = {
      on: 'bg-success-soft',
      off: 'bg-danger-soft',
      partial: 'bg-warning-soft',
      pending: 'bg-info-soft',
      archived: 'bg-bg2',
    };
    for (const status of ALL) {
      const { container, unmount } = render(<StatusChip status={status} />);
      expect(
        container.querySelector('[data-slot="status-chip"]')!.className,
        `${status} wash`,
      ).toContain(expected[status]);
      unmount();
    }
  });

  it('keeps archived off the status colour axis', () => {
    /**
     * Archived is not a state of the thing, it is a statement that the thing is
     * no longer live. A status colour would invite "archived, and also somehow
     * off".
     */
    const { container } = render(<StatusChip status="archived" />);
    const cls = container.querySelector('[data-slot="status-chip"]')!.className;
    expect(cls).not.toMatch(/bg-(success|danger|warning|info)-soft/);
  });
});

describe('StatusChip, the customisable channels', () => {
  it('lets a caller replace the glyph', () => {
    /**
     * The five built-ins cover a control plane's own vocabulary. They do not
     * cover a provider logo, a spinner for a state still resolving, or a house
     * glyph a consuming product already uses for the same idea.
     */
    const { container: stock, unmount } = render(<StatusChip status="pending" />);
    const stockPath = stock.querySelector('svg')!.innerHTML;
    unmount();

    const { container } = render(<StatusChip status="pending" icon={<ZapIcon />} />);
    expect(container.querySelector('svg')!.innerHTML).not.toBe(stockPath);
  });

  it('takes an ELEMENT, not a component type , the system-wide icon idiom', () => {
    /**
     * `icon={<ZapIcon />}`, the same shape as EmptyState. An element is what
     * lets a non-icon glyph through at all; a `ComponentType<IconProps>` slot
     * would accept only things built by `createIcon`.
     */
    const { container } = render(
      <StatusChip status="pending" icon={<span data-testid="not-an-icon">◐</span>} />,
    );
    expect(container.querySelector('[data-testid="not-an-icon"]')).not.toBeNull();
  });

  it('hides an overridden glyph even when the glyph does not hide itself', () => {
    /**
     * `createIcon` sets `aria-hidden`; an arbitrary element does not. So the
     * attribute lives on the WRAPPER , otherwise a caller passing a bare <svg>
     * or an <img> silently adds a second announcement of the state, which is
     * invisible on screen and audible only to the readers this component exists
     * to serve.
     */
    const { container } = render(
      <StatusChip status="on" icon={<svg data-testid="bare" viewBox="0 0 24 24" />} />,
    );
    const bare = container.querySelector('[data-testid="bare"]')!;
    // The glyph itself carries nothing , that is the point of the case.
    expect(bare.getAttribute('aria-hidden')).toBeNull();
    // ...and it is still out of the tree, because an ancestor hides it.
    expect(bare.closest('[aria-hidden="true"]')).not.toBeNull();
  });

  it('lets a caller replace the colour, and only with a gated pairing', () => {
    /**
     * The override is `variant`, so every reachable value is a wash/text pair
     * SOFT_CHIP_PAIRS has already measured flattened over page, panel and glass
     * in both themes. A `color` prop taking a hex would let a caller invent a
     * pairing nothing gates, on the one component whose whole argument is that
     * the pairing is gated.
     */
    const { container } = render(<StatusChip status="on" variant="info" />);
    const cls = container.querySelector('[data-slot="status-chip"]')!.className;
    expect(cls).toContain('bg-info-soft');
    expect(cls).not.toContain('bg-success-soft');
  });

  it('keeps the status identity when every channel is overridden', () => {
    /**
     * `data-status` and STATUS_ORDER are keyed on `status`, not on what the chip
     * was dressed as , a chip painted blue and given a bolt still has to sort,
     * filter and group as the state it actually is.
     */
    const { container } = render(
      <StatusChip status="off" icon={<ZapIcon />} variant="info">
        Draining
      </StatusChip>,
    );
    expect(container.querySelector('[data-status="off"]')).not.toBeNull();
    expect(STATUS_ORDER.off).toBe(0);
  });

  it('renders the glyph at 11px, which needs a CLASS and not `size`', () => {
    /**
     * REGRESSION GUARD, and it is guarding a bug that shipped.
     *
     * This component rendered `<StatusIcon size={11} />` from the day it was
     * written, and the glyph measured 12 the whole time: `size` emits
     * `width`/`height` presentation attributes, Badge sets
     * `[&_svg:not([class*='size-'])]:size-3`, and a presentation attribute loses
     * the cascade to any author rule. Nothing caught it because happy-dom
     * applies no Tailwind at all, so the ATTRIBUTE was the only observable and
     * it said 11.
     *
     * So the assertion is on the class, and specifically on the merge: Badge's
     * rule and this one are the same utility on the same element, and only
     * twMerge collapsing them makes the winner deterministic rather than a
     * question of stylesheet order.
     */
    const { container } = render(<StatusChip status="on" />);
    const cls = container.querySelector('[data-slot="status-chip"]')!.className;
    expect(cls).toContain("[&_svg:not([class*='size-'])]:size-[11px]");
    expect(cls).not.toContain("[&_svg:not([class*='size-'])]:size-3");
    // And the dead `size` attribute is gone rather than lingering as a lie.
    expect(container.querySelector('svg')!.getAttribute('width')).not.toBe('11');
  });

  it('lets an overriding icon opt out of the size with a class', () => {
    /**
     * The documented escape hatch is `className="size-4"`. `size={16}` is the
     * one that does not work, for the reason above.
     */
    const { container } = render(
      <StatusChip status="on" icon={<CircleCheckIcon className="size-4" />} />,
    );
    expect(container.querySelector('svg')!.getAttribute('class')).toContain('size-4');
  });
});

describe('STATUS_ORDER', () => {
  it('sorts off first and archived last', () => {
    /**
     * Someone opening a list during an incident is looking for what is switched
     * off. Archived sorts last because it is not a live state at all.
     */
    const sorted = [...ALL].sort((a, b) => STATUS_ORDER[a] - STATUS_ORDER[b]);
    expect(sorted[0]).toBe('off');
    expect(sorted.at(-1)).toBe('archived');
  });

  it('covers every status exactly once', () => {
    expect(Object.keys(STATUS_ORDER).sort()).toEqual([...ALL].sort());
    expect(new Set(Object.values(STATUS_ORDER)).size).toBe(ALL.length);
  });
});

describe('StatusChip, axe', () => {
  it('finds no violations across the whole vocabulary', async () => {
    const violations = await audit(
      <div>
        {ALL.map((status) => (
          <StatusChip key={status} status={status} />
        ))}
        {/* And the customised form, whose glyph is hidden by a wrapper. */}
        <StatusChip status="off" icon={<ZapIcon />} variant="info">
          Draining
        </StatusChip>
      </div>,
    );
    expect(violations.map((v) => v.id)).toEqual([]);
  });
});
