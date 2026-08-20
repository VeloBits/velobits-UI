import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  paginationRange,
} from '../../../registry/velobits/ui/pagination';
import { audit } from './axe';

function Fixture({ page = 4, pageCount = 20 }: { page?: number; pageCount?: number }) {
  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious disabled={page === 1} />
        </PaginationItem>
        {paginationRange({ page, pageCount }).map((slot, i) => (
          <PaginationItem key={slot === 'ellipsis' ? `gap-${i}` : slot}>
            {slot === 'ellipsis' ? (
              <PaginationEllipsis />
            ) : (
              <PaginationLink href={`?page=${slot}`} isActive={slot === page}>
                {slot}
              </PaginationLink>
            )}
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext disabled={page === pageCount} />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}

describe('paginationRange, the arithmetic', () => {
  it('returns every page when the range fits', () => {
    expect(paginationRange({ page: 1, pageCount: 7 })).toEqual([1, 2, 3, 4, 5, 6, 7]);
  });

  it('is empty for zero pages', () => {
    expect(paginationRange({ page: 1, pageCount: 0 })).toEqual([]);
  });

  it('keeps a CONSTANT number of slots once it has to cut', () => {
    /**
     * The property the naive implementation misses. It drops an ellipsis near
     * either end, so the control is 6 slots wide on page 1, 7 in the middle and 6
     * again at the end , every button shifts sideways as you page and the number
     * you were about to click moves out from under the pointer.
     */
    for (let page = 1; page <= 20; page++) {
      expect(paginationRange({ page, pageCount: 20 }), `page ${page}`).toHaveLength(7);
    }
  });

  it('cuts on the right near the start and on the left near the end', () => {
    expect(paginationRange({ page: 1, pageCount: 20 })).toEqual([1, 2, 3, 4, 5, 'ellipsis', 20]);
    expect(paginationRange({ page: 20, pageCount: 20 })).toEqual([
      1,
      'ellipsis',
      16,
      17,
      18,
      19,
      20,
    ]);
  });

  it('cuts both sides in the middle, current page centred', () => {
    expect(paginationRange({ page: 10, pageCount: 20 })).toEqual([
      1,
      'ellipsis',
      9,
      10,
      11,
      'ellipsis',
      20,
    ]);
  });

  it('never spends an ellipsis on a single hidden page', () => {
    /**
     * An ellipsis standing in for exactly one page is strictly worse than the
     * page: same width, less information, one more click to reach something that
     * was on screen a moment ago.
     *
     * This is the off-by-one the usual implementation ships. With the textbook
     * `leftSibling > 2` / `rightSibling < pageCount - 1` bounds,
     * `{ page: 5, pageCount: 8 }` renders `1 … 4 5 6 … 8` , where the second
     * ellipsis stands in for page 7 and nothing else. Caught here, fixed in
     * `paginationRange`.
     */
    for (let pageCount = 8; pageCount <= 24; pageCount++) {
      for (let page = 1; page <= pageCount; page++) {
        const range = paginationRange({ page, pageCount });
        for (let i = 0; i < range.length; i++) {
          if (range[i] !== 'ellipsis') continue;
          const before = range[i - 1] as number;
          const after = range[i + 1] as number;
          expect(
            after - before - 1,
            `page ${page} of ${pageCount}: an ellipsis between ${before} and ${after}`,
          ).toBeGreaterThanOrEqual(2);
        }
      }
    }
  });

  it('always contains the current page', () => {
    for (let pageCount = 1; pageCount <= 24; pageCount++) {
      for (let page = 1; page <= pageCount; page++) {
        expect(paginationRange({ page, pageCount }), `page ${page} of ${pageCount}`).toContain(
          page,
        );
      }
    }
  });

  it('honours a wider sibling window, still at constant width', () => {
    for (let page = 1; page <= 30; page++) {
      expect(paginationRange({ page, pageCount: 30, siblings: 2 }), `page ${page}`).toHaveLength(9);
    }
  });

  it('clamps an out-of-range page instead of producing nonsense', () => {
    expect(paginationRange({ page: 0, pageCount: 20 })).toEqual(
      paginationRange({ page: 1, pageCount: 20 }),
    );
    expect(paginationRange({ page: 99, pageCount: 20 })).toEqual(
      paginationRange({ page: 20, pageCount: 20 }),
    );
  });
});

describe('Pagination structure', () => {
  it('is a named navigation landmark wrapping a list', () => {
    render(<Fixture />);
    expect(screen.getByRole('navigation', { name: 'Pagination' })).toBeTruthy();
    expect(screen.getByRole('list').tagName).toBe('UL');
  });

  it('marks the active page with aria-current, not just a border', () => {
    /** A screen reader cannot see an outline. */
    render(<Fixture page={4} />);
    expect(screen.getByRole('link', { name: '4' }).getAttribute('aria-current')).toBe('page');
    expect(screen.getByRole('link', { name: '5' }).getAttribute('aria-current')).toBeNull();
  });

  it('uses tabular figures so the row does not reflow as digits change', () => {
    render(<Fixture />);
    expect(screen.getByRole('link', { name: '4' }).className).toContain('tabular-nums');
  });

  it('makes the ellipsis unfocusable but announced', () => {
    render(<Fixture />);
    // Two of them mid-range: `1 … 3 4 5 … 20`.
    for (const ellipsis of screen.getAllByText('More pages')) {
      expect(ellipsis.closest('a')).toBeNull();
      expect(ellipsis.closest('button')).toBeNull();
    }
  });
});

describe('Pagination, numbers are links and steps are buttons', () => {
  it('renders page numbers as anchors, so they can be opened in a new tab', () => {
    render(<Fixture />);
    const link = screen.getByRole('link', { name: '5' });
    expect(link.tagName).toBe('A');
    expect(link.getAttribute('href')).toBe('?page=5');
  });

  it('renders previous and next as real buttons', () => {
    /**
     * An `<a>` cannot express "unavailable": strip its href and it stops being a
     * link AND stops being focusable, so a keyboard user finds the control has
     * silently vanished at the ends of the range.
     */
    render(<Fixture />);
    expect(screen.getByRole('button', { name: 'Go to previous page' }).tagName).toBe('BUTTON');
    expect(screen.getByRole('button', { name: 'Go to next page' }).tagName).toBe('BUTTON');
  });
});

describe('Pagination, unavailability keeps focus', () => {
  it('uses aria-disabled rather than the disabled attribute', () => {
    /**
     * A `disabled` button leaves the tab order, so on the last page the control
     * the user's focus is sitting in disappears from under them and the next Tab
     * restarts from the top of the document.
     */
    render(<Fixture page={1} />);
    const prev = screen.getByRole('button', { name: 'Go to previous page' });
    expect(prev.getAttribute('aria-disabled')).toBe('true');
    expect(prev.hasAttribute('disabled')).toBe(false);
  });

  it('stays focusable when unavailable', async () => {
    render(<Fixture page={1} />);
    const prev = screen.getByRole('button', { name: 'Go to previous page' });
    prev.focus();
    expect(document.activeElement).toBe(prev);
  });

  it('actually swallows the click, which aria-disabled alone does NOT', async () => {
    /**
     * The classic half-fix: it looks disabled, it announces disabled, and it
     * still fires. `aria-disabled` is a message to assistive tech, not a
     * behaviour.
     */
    const onClick = vi.fn();
    render(<PaginationPrevious disabled onClick={onClick} />);
    await userEvent.click(screen.getByRole('button', { name: 'Go to previous page' }));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('fires normally when available', async () => {
    const onClick = vi.fn();
    render(<PaginationNext onClick={onClick} />);
    await userEvent.click(screen.getByRole('button', { name: 'Go to next page' }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('does not use pointer-events-none to fake the disable', () => {
    /**
     * It would stop the element receiving the click the guard exists to swallow,
     * and on some platforms it suppresses the focus ring too.
     */
    render(<PaginationPrevious disabled />);
    const cls = screen.getByRole('button', { name: 'Go to previous page' }).className;
    expect(cls).toContain('aria-disabled:opacity-50');
    // A BARE one. `disabled:pointer-events-none` and the `[&_svg]` rule come from
    // buttonVariants and are unreachable here, since nothing is `disabled`.
    expect(cls.split(/\s+/)).not.toContain('pointer-events-none');
    expect(cls).not.toContain('aria-disabled:pointer-events-none');
  });
});

describe('Pagination, axe', () => {
  /**
   * One `it` per page rather than a loop inside one: `audit()` renders its own
   * `<main>` and RTL only cleans up between tests, so two audits in a single test
   * produce two main landmarks and a violation that is an artefact of the
   * harness.
   */
  for (const page of [1, 10, 20]) {
    it(`finds no violations on page ${page} of 20`, async () => {
      const violations = await audit(<Fixture page={page} />);
      expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
    });
  }
});
