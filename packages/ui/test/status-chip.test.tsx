import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

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
      </div>,
    );
    expect(violations.map((v) => v.id)).toEqual([]);
  });
});
