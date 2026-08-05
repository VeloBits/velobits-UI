import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { Checkbox } from '../../../registry/velobits/ui/checkbox';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../registry/velobits/ui/table';
import { audit } from './axe';

function Fixture() {
  return (
    <Table>
      <TableCaption>Flags in Production</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>
            <Checkbox aria-label="Select all rows" />
          </TableHead>
          <TableHead>Key</TableHead>
          <TableHead>Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow data-state="selected">
          <TableCell>
            <Checkbox aria-label="Select new-checkout" checked />
          </TableCell>
          <TableCell>new-checkout</TableCell>
          <TableCell>On</TableCell>
        </TableRow>
        <TableRow>
          <TableCell>
            <Checkbox aria-label="Select dark-mode" />
          </TableCell>
          <TableCell>dark-mode</TableCell>
          <TableCell>Off</TableCell>
        </TableRow>
      </TableBody>
      <TableFooter>
        <TableRow>
          <TableCell colSpan={3}>2 flags</TableCell>
        </TableRow>
      </TableFooter>
    </Table>
  );
}

describe('Table semantics', () => {
  it('renders real table elements, so the grid roles come for free', () => {
    render(<Fixture />);
    const table = screen.getByRole('table');
    expect(table.tagName).toBe('TABLE');
    expect(screen.getAllByRole('rowgroup')).toHaveLength(3); // thead, tbody, tfoot
    expect(screen.getAllByRole('columnheader')).toHaveLength(3);
    expect(screen.getAllByRole('row')).toHaveLength(4); // 1 header + 2 body + 1 footer
  });

  it('names the table from its caption', () => {
    /**
     * A data table with no caption and no aria-label is announced as "table" plus
     * a row and column count, which does not say which of three tables on the
     * page you landed in. The caption IS the accessible name.
     */
    render(<Fixture />);
    const table = screen.getByRole('table');
    expect(table.querySelector('caption')!.textContent).toBe('Flags in Production');
    expect(screen.getByRole('table', { name: 'Flags in Production' })).toBe(table);
  });

  it('paints the caption below while keeping it first in the DOM', () => {
    /** Announcement order comes from the DOM; `caption-bottom` moves only paint. */
    render(<Fixture />);
    const table = screen.getByRole('table');
    expect(table.firstElementChild!.tagName).toBe('CAPTION');
    expect(table.className).toContain('caption-bottom');
  });

  it('gives every column header an explicit scope', () => {
    /**
     * The implicit scope a `<th>` in a `<thead>` gets is real HTML, but AT applies
     * it unevenly once a table also has a footer or spanning cells — and the
     * failure is a screen reader reading the wrong column name for every cell in a
     * row, which is invisible on screen.
     */
    render(<Fixture />);
    for (const th of screen.getAllByRole('columnheader')) {
      expect(th.getAttribute('scope')).toBe('col');
    }
  });

  it('lets a row header override the scope', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableHead scope="row">new-checkout</TableHead>
            <TableCell>On</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    expect(screen.getByRole('rowheader').getAttribute('scope')).toBe('row');
  });

  it('wraps the table in a scroll container, not a bare div', () => {
    const { container } = render(<Fixture />);
    const wrapper = container.querySelector('[data-slot="table-container"]')!;
    expect(wrapper.className).toContain('overflow-x-auto');
    expect(wrapper.firstElementChild!.tagName).toBe('TABLE');
  });
});

describe('Table, THE GLASS RULE', () => {
  /**
   * A row must never be glass and must never carry backdrop-filter: the filter is
   * per-element, so N rows means N blur layers each re-sampling its own slice of
   * the backdrop on every scrolled frame — the table gets worse the more data it
   * has. It also makes each row a stacking context and a containing block for
   * fixed descendants.
   */

  it('keeps every row free of glass and of any filter', () => {
    render(<Fixture />);
    for (const row of screen.getAllByRole('row')) {
      const cls = row.className;
      expect(cls).not.toMatch(/\bglass\b/);
      expect(cls).not.toMatch(/backdrop-blur|backdrop-filter|\bblur-/);
      expect(row.getAttribute('style')).toBeNull();
    }
  });

  it('washes rows with flat opaque tokens instead', () => {
    /** --highlight for hover, --bg2 for selected: one paint, no compositing layer. */
    render(<Fixture />);
    const cls = screen.getAllByRole('row')[1]!.className;
    expect(cls).toContain('hover:bg-highlight');
    expect(cls).toContain('data-[state=selected]:bg-bg2');
    // transition-all would happily animate a layout property a caller adds.
    expect(cls).toContain('transition-colors');
    expect(cls).not.toContain('transition-all');
  });

  it('routes surface treatment to the container, which is the only place it belongs', () => {
    const { container } = render(
      <Table containerClassName="rounded-lg border border-border bg-panel shadow-sm">
        <TableBody>
          <TableRow>
            <TableCell>x</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const wrapper = container.querySelector('[data-slot="table-container"]')!;
    expect(wrapper.className).toContain('bg-panel');
    // And it did NOT leak onto the table or the row.
    expect(screen.getByRole('table').className).not.toContain('bg-panel');
    expect(screen.getByRole('row').className).not.toContain('bg-panel');
  });
});

describe('Table, RTL and overrides', () => {
  it('aligns headers with a logical property so RTL needs no variant', () => {
    render(<Fixture />);
    const cls = screen.getAllByRole('columnheader')[1]!.className;
    expect(cls).toContain('text-start');
    expect(cls).not.toContain('text-left');
  });

  it('uses logical padding for the checkbox gutter', () => {
    render(<Fixture />);
    expect(screen.getAllByRole('columnheader')[0]!.className).toContain(
      '[&:has([role=checkbox])]:pe-0',
    );
    const cell = screen.getAllByRole('cell')[0]!;
    expect(cell.className).toContain('[&:has([role=checkbox])]:pe-0');
    expect(cell.className).not.toContain('pr-0');
  });

  it('lets a caller class win on a cell', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell className="p-4">x</TableCell>
          </TableRow>
        </TableBody>
      </Table>,
    );
    const cls = screen.getByRole('cell').className;
    expect(cls).toContain('p-4');
    expect(cls).not.toMatch(/\bp-2\b/);
  });
});

describe('Table, axe', () => {
  it('finds no structural violations on a caption + checkbox-column table', async () => {
    const violations = await audit(<Fixture />);
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
