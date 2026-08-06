import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { DiffViewer, diffLines } from '../../../registry/velobits/ui/diff-viewer';
import { audit } from './axe';

const BEFORE = 'a\nb\nc';
const AFTER = 'a\nB\nc\nd';

describe('diffLines', () => {
  it('keeps unchanged lines and pairs a replacement removed-then-added', () => {
    expect(diffLines(BEFORE, AFTER)).toEqual([
      { kind: 'same', text: 'a' },
      { kind: 'removed', text: 'b' },
      { kind: 'added', text: 'B' },
      { kind: 'same', text: 'c' },
      { kind: 'added', text: 'd' },
    ]);
  });

  it('reports no change as all-same', () => {
    expect(diffLines(BEFORE, BEFORE).every((l) => l.kind === 'same')).toBe(true);
  });

  it('handles an empty side', () => {
    expect(diffLines('', 'x')).toEqual([
      { kind: 'removed', text: '' },
      { kind: 'added', text: 'x' },
    ]);
  });

  it('is order-preserving — the output reads as the AFTER document', () => {
    const lines = diffLines(BEFORE, AFTER);
    const after = lines.filter((l) => l.kind !== 'removed').map((l) => l.text);
    expect(after.join('\n')).toBe(AFTER);
  });

  it('degrades to a whole-block replace beyond the guard', () => {
    /**
     * LCS is O(n·m) in time AND MEMORY — the table is n × m numbers. Two
     * 5,000-line inputs is 25 million array slots allocated synchronously on the
     * main thread, so the tab dies rather than lags. Config payloads never reach
     * this; the guard exists because "never in practice" is where the
     * pathological input eventually arrives.
     */
    const long = Array.from({ length: 12 }, (_, i) => `line ${i}`).join('\n');
    const lines = diffLines(long, long, 4);
    expect(lines.filter((l) => l.kind === 'same')).toHaveLength(0);
    expect(lines.filter((l) => l.kind === 'removed')).toHaveLength(12);
    expect(lines.filter((l) => l.kind === 'added')).toHaveLength(12);
  });
});

describe('DiffViewer, the marker is the primary channel', () => {
  it('gives every line a +, − or blank gutter', () => {
    /**
     * WCAG 1.4.1. The green/red wash is indistinguishable to a red/green-deficient
     * reader, and `line-through` marks removals only — leaving additions and
     * unchanged lines identical. The gutter is also the only channel that
     * survives greyscale and a screenshot pasted into a ticket.
     */
    const { container } = render(<DiffViewer lines={diffLines(BEFORE, AFTER)} />);
    const markers = [...container.querySelectorAll('[data-slot="diff-marker"]')];
    expect(markers.map((m) => m.textContent)).toEqual([' ', '−', '+', ' ', '+']);
  });

  it('does NOT hide the marker from assistive tech', () => {
    /**
     * The inverse of `StatusChip`'s icon: there is no text label beside it saying
     * "added", so the marker IS how a line read in sequence announces as changed.
     */
    const { container } = render(<DiffViewer lines={diffLines(BEFORE, AFTER)} />);
    for (const marker of container.querySelectorAll('[data-slot="diff-marker"]')) {
      expect(marker.getAttribute('aria-hidden')).toBeNull();
    }
  });

  it('keeps the gutter out of a copied selection', () => {
    /** Otherwise a pasted diff is code plus a column of punctuation. */
    const { container } = render(<DiffViewer lines={diffLines(BEFORE, AFTER)} />);
    expect(container.querySelector('[data-slot="diff-marker"]')!.className).toContain(
      'select-none',
    );
  });

  it('uses a minus sign, not a hyphen', () => {
    /** U+2212 matches `+` in width and vertical position in a monospace face. */
    const { container } = render(<DiffViewer lines={[{ kind: 'removed', text: 'x' }]} />);
    expect(container.querySelector('[data-slot="diff-marker"]')!.textContent).toBe('−');
  });

  it('still carries the colour wash and the strike as secondary channels', () => {
    const { container } = render(<DiffViewer lines={diffLines(BEFORE, AFTER)} />);
    const added = container.querySelector('[data-kind="added"]')!;
    const removed = container.querySelector('[data-kind="removed"]')!;
    expect(added.className).toContain('bg-success-soft');
    expect(removed.className).toContain('bg-danger-soft');
    expect(removed.className).toContain('line-through');
  });
});

describe('DiffViewer, what a screen reader gets', () => {
  it('folds a counted summary into the region name', () => {
    /**
     * A per-line "added"/"removed" would announce the word "same" 190 times on a
     * 200-line diff. The count is what a non-visual reader wants first, and
     * putting it in the region's own name means it arrives on entry rather than
     * only if they read down to it.
     */
    render(<DiffViewer lines={diffLines(BEFORE, AFTER)} label="Config v3 → v4" />);
    screen.getByRole('region', { name: 'Config v3 → v4. 2 lines added, 1 removed' });
  });

  it('falls back to the summary alone when unlabelled', () => {
    render(<DiffViewer lines={diffLines(BEFORE, AFTER)} />);
    screen.getByRole('region', { name: '2 lines added, 1 removed' });
  });

  it('singularises one added line', () => {
    render(<DiffViewer lines={[{ kind: 'added', text: 'x' }]} />);
    screen.getByRole('region', { name: '1 line added, 0 removed' });
  });

  it('hides the VISIBLE summary, because the region name already says it', () => {
    /** Announcing it twice is the more common bug than announcing it never. */
    const { container } = render(<DiffViewer lines={diffLines(BEFORE, AFTER)} />);
    const summary = container.querySelector('[data-slot="diff-viewer-summary"]')!;
    expect(summary.textContent).toBe('2 lines added, 1 removed');
    expect(summary.getAttribute('aria-hidden')).toBe('true');
  });

  it('can drop the visible summary while keeping the announced one', () => {
    const { container } = render(<DiffViewer lines={diffLines(BEFORE, AFTER)} hideSummary />);
    expect(container.querySelector('[data-slot="diff-viewer-summary"]')).toBeNull();
    screen.getByRole('region', { name: '2 lines added, 1 removed' });
  });

  it('makes the scroll region keyboard-reachable', () => {
    render(<DiffViewer lines={diffLines(BEFORE, AFTER)} />);
    expect(screen.getByRole('region').getAttribute('tabindex')).toBe('0');
  });

  it('does not wrap, so one line stays one change', () => {
    /**
     * A soft-wrapped continuation has no gutter marker, so it reads as an
     * unchanged line inside a change.
     */
    const { container } = render(<DiffViewer lines={diffLines(BEFORE, AFTER)} />);
    expect(container.querySelector('[data-slot="diff-line"]')!.className).toContain(
      'whitespace-pre',
    );
  });
});

describe('DiffViewer, axe', () => {
  it('finds no violations on a labelled diff', async () => {
    const violations = await audit(
      <DiffViewer lines={diffLines(BEFORE, AFTER)} label="Config v3 → v4" />,
    );
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
