import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { useRowSelection } from '../../../registry/velobits/hooks/use-row-selection';
import { Checkbox } from '../../../registry/velobits/ui/checkbox';
import {
  DataTable,
  nextSort,
  type DataTableColumn,
  type SortState,
} from '../../../registry/velobits/ui/data-table';
import { EmptyState } from '../../../registry/velobits/ui/empty-state';
import { audit } from './axe';

interface Row {
  id: string;
  key: string;
  enabled: boolean;
}

const ROWS: Row[] = [
  { id: '1', key: 'new-checkout', enabled: true },
  { id: '2', key: 'dark-mode', enabled: false },
  { id: '3', key: 'beta-search', enabled: true },
];

interface Ctx {
  onToggle: (row: Row) => void;
  admin?: boolean;
}

const COLUMNS: DataTableColumn<Row, Ctx>[] = [
  { id: 'key', header: 'Key', sortKey: 'key', cell: (row) => row.key },
  { id: 'state', header: 'State', sortKey: 'state', cell: (row) => (row.enabled ? 'On' : 'Off') },
  {
    id: 'toggle',
    header: 'Actions',
    hideHeader: true,
    interactive: true,
    cell: (row, ctx) => (
      <button type="button" onClick={() => ctx.onToggle(row)}>
        Flip {row.key}
      </button>
    ),
  },
  {
    id: 'admin',
    header: 'Owner',
    visible: (ctx) => Boolean(ctx.admin),
    cell: () => 'ops',
  },
];

const CTX: Ctx = { onToggle: () => {} };

function Fixture(props: Partial<React.ComponentProps<typeof DataTable<Row, Ctx>>> = {}) {
  return (
    <DataTable
      label="Flags in Production"
      columns={COLUMNS}
      rows={ROWS}
      rowKey={(row) => row.id}
      context={CTX}
      {...props}
    />
  );
}

describe('nextSort', () => {
  it('starts a new column ascending and flips the active one', () => {
    const start: SortState = { key: 'key', dir: 'asc' };
    expect(nextSort(start, 'state')).toEqual({ key: 'state', dir: 'asc' });
    expect(nextSort(start, 'key')).toEqual({ key: 'key', dir: 'desc' });
    expect(nextSort({ key: 'key', dir: 'desc' }, 'key')).toEqual({ key: 'key', dir: 'asc' });
  });
});

describe('DataTable, the column registry', () => {
  it('renders a cell per visible column per row', () => {
    render(<Fixture />);
    expect(screen.getAllByRole('row')).toHaveLength(4); // header + 3
    expect(screen.getAllByRole('columnheader')).toHaveLength(3); // admin hidden
  });

  it('honours a column predicate against the context', () => {
    render(<Fixture context={{ ...CTX, admin: true }} />);
    expect(screen.getByRole('columnheader', { name: 'Owner' })).toBeTruthy();
  });

  it('names the table from a caption, which is the accessible name', () => {
    render(<Fixture />);
    expect(screen.getByRole('table', { name: 'Flags in Production' })).toBeTruthy();
  });

  it('can hide the caption visually while keeping the name', () => {
    render(<Fixture hideLabel />);
    const table = screen.getByRole('table', { name: 'Flags in Production' });
    expect(table.querySelector('caption')!.className).toContain('sr-only');
  });
});

describe('DataTable, sorting', () => {
  it('puts aria-sort on the TH, not on the sort button', () => {
    /**
     * `aria-sort` describes the column and AT reads it from the header cell. On
     * the button it is silently ignored , the arrow keeps working, the
     * announcement does not, and nothing anywhere reports a problem.
     */
    render(<Fixture sort={{ key: 'key', dir: 'asc' }} onSortChange={() => {}} />);
    const th = screen.getByRole('columnheader', { name: 'Key' });
    expect(th.getAttribute('aria-sort')).toBe('ascending');
    expect(th.querySelector('button')!.getAttribute('aria-sort')).toBeNull();
  });

  it('omits aria-sort on inactive columns rather than saying "none"', () => {
    render(<Fixture sort={{ key: 'key', dir: 'asc' }} onSortChange={() => {}} />);
    expect(
      screen.getByRole('columnheader', { name: 'State' }).getAttribute('aria-sort'),
    ).toBeNull();
  });

  it('reports descending when it is descending', () => {
    render(<Fixture sort={{ key: 'key', dir: 'desc' }} onSortChange={() => {}} />);
    expect(screen.getByRole('columnheader', { name: 'Key' }).getAttribute('aria-sort')).toBe(
      'descending',
    );
  });

  it('emits the next sort state on click', async () => {
    const onSortChange = vi.fn();
    render(<Fixture sort={{ key: 'key', dir: 'asc' }} onSortChange={onSortChange} />);
    await userEvent.click(screen.getByRole('button', { name: 'Key' }));
    expect(onSortChange).toHaveBeenCalledWith({ key: 'key', dir: 'desc' });
  });

  it('renders a plain header when there is no handler to call', () => {
    render(<Fixture />);
    expect(screen.queryByRole('button', { name: 'Key' })).toBeNull();
    expect(screen.getByRole('columnheader', { name: 'Key' })).toBeTruthy();
  });

  it('keeps a hidden column header as an accessible NAME, not as an empty th', () => {
    /**
     * axe's `empty-table-header`, and the reason it exists: a `<th>` with no text
     * leaves a screen reader announcing every cell in that column with no idea
     * what it contains. An actions column has no visible title and still has a
     * name.
     */
    render(<Fixture />);
    const th = screen.getByRole('columnheader', { name: 'Actions' });
    expect(th.textContent).toBe('Actions');
    expect(th.querySelector('span')!.className).toContain('sr-only');
  });

  it('neutralises a legacy bare-button rule on the sort control', () => {
    /**
     * Not tidying. A consumer whose stylesheet styles bare `button` in Tailwind's
     * `components` layer renders every column header as a bordered form control
     * without these three.
     */
    render(<Fixture sort={{ key: 'key', dir: 'asc' }} onSortChange={() => {}} />);
    const cls = screen.getByRole('button', { name: 'Key' }).className;
    for (const c of ['border-0', 'bg-transparent', 'p-0']) expect(cls).toContain(c);
  });
});

describe('DataTable, row activation is not mouse-only', () => {
  it('does not make rows focusable when there is nothing to activate', () => {
    render(<Fixture />);
    for (const row of screen.getAllByRole('row')) {
      expect(row.getAttribute('tabindex')).toBeNull();
    }
  });

  it('opens on click', async () => {
    const onRowActivate = vi.fn();
    render(<Fixture onRowActivate={onRowActivate} rowLabel={(r) => r.key} />);
    await userEvent.click(screen.getByText('dark-mode'));
    expect(onRowActivate).toHaveBeenCalledWith(ROWS[1]);
  });

  it('opens on Enter and on Space', async () => {
    /**
     * `onClick` on a `<tr>` is the most common keyboard trap in an admin UI: it
     * works for everyone testing with a mouse, and a keyboard user simply cannot
     * open the record.
     */
    const onRowActivate = vi.fn();
    render(<Fixture onRowActivate={onRowActivate} rowLabel={(r) => r.key} />);
    const row = screen.getByRole('row', { name: 'new-checkout' });
    row.focus();
    await userEvent.keyboard('{Enter}');
    await userEvent.keyboard(' ');
    expect(onRowActivate).toHaveBeenCalledTimes(2);
  });

  it('names the focusable row, so it is not announced as nine cells of prose', () => {
    render(<Fixture onRowActivate={() => {}} rowLabel={(r) => r.key} />);
    const row = screen.getByRole('row', { name: 'beta-search' });
    expect(row.getAttribute('tabindex')).toBe('0');
  });

  it('does NOT activate when the key press came from a control inside a cell', async () => {
    /**
     * The trap that survives review, because nobody tests the keyboard path
     * through a cell control: without the `target === currentTarget` check,
     * pressing Space on a row's checkbox ticks the box AND opens the row.
     */
    const onRowActivate = vi.fn();
    render(<Fixture onRowActivate={onRowActivate} rowLabel={(r) => r.key} />);
    const inner = screen.getByRole('button', { name: 'Flip new-checkout' });
    inner.focus();
    await userEvent.keyboard('{Enter}');
    expect(onRowActivate).not.toHaveBeenCalled();
  });

  it('lets an interactive cell swallow the click', async () => {
    /** Otherwise flipping a switch also opens the row. */
    const onRowActivate = vi.fn();
    const onToggle = vi.fn();
    render(
      <Fixture context={{ onToggle }} onRowActivate={onRowActivate} rowLabel={(r) => r.key} />,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Flip dark-mode' }));
    expect(onToggle).toHaveBeenCalledOnce();
    expect(onRowActivate).not.toHaveBeenCalled();
  });
});

describe('DataTable, selection and emptiness', () => {
  it('reuses the shared selected wash rather than a second class for the same idea', () => {
    render(<Fixture isRowSelected={(row) => row.id === '2'} />);
    const row = screen.getAllByRole('row')[2]!;
    expect(row.getAttribute('data-state')).toBe('selected');
  });

  it('does not claim aria-selected on a plain table row', () => {
    /**
     * This is a `table`, not a `grid`. The accessible truth about selection is
     * the checkbox in the select column, which announces checked; a second
     * statement of the same fact in a role context screen readers handle
     * inconsistently can only disagree with it.
     */
    render(<Fixture isRowSelected={() => true} />);
    for (const row of screen.getAllByRole('row')) {
      expect(row.getAttribute('aria-selected')).toBeNull();
    }
  });

  it('renders the empty state as a real spanning row', () => {
    /**
     * An empty `<tbody>` announces as a table with zero rows and reads as a
     * failed render. This way the explanation is IN the table, where someone who
     * just narrowed a filter is already looking.
     */
    render(<Fixture rows={[]} empty={<EmptyState title="No flags match this filter" />} />);
    expect(screen.getByText('No flags match this filter')).toBeTruthy();
    expect(screen.getAllByRole('cell')[0]!.getAttribute('colspan')).toBe('3');
  });

  it('spans the VISIBLE column count, not the declared one', () => {
    render(
      <Fixture rows={[]} context={{ ...CTX, admin: true }} empty={<EmptyState title="None" />} />,
    );
    expect(screen.getAllByRole('cell')[0]!.getAttribute('colspan')).toBe('4');
  });
});

describe('useRowSelection, the selection is DERIVED', () => {
  it('intersects the stored set with the rows on screen', () => {
    /**
     * A bulk action must never point at something invisible. "Disable 12 flags"
     * has to mean the twelve you can see and count.
     */
    const { result, rerender } = renderHook(
      ({ rows }: { rows: Row[] }) => useRowSelection(rows, (r) => r.id),
      { initialProps: { rows: ROWS } },
    );
    act(() => result.current.toggle('2'));
    expect(result.current.count).toBe(1);

    // A filter narrows the list and row 2 is no longer on screen.
    rerender({ rows: [ROWS[0]!] });
    expect(result.current.count).toBe(0);
    expect(result.current.isSelected('2')).toBe(false);
  });

  it('brings a selection back when its row returns', () => {
    /**
     * The raw set is deliberately NOT pruned: selection survives you looking
     * elsewhere. It does not survive being told the row no longer exists, because
     * the intersection drops it the moment the server stops sending it.
     */
    const { result, rerender } = renderHook(
      ({ rows }: { rows: Row[] }) => useRowSelection(rows, (r) => r.id),
      { initialProps: { rows: ROWS } },
    );
    act(() => result.current.toggle('3'));
    rerender({ rows: [ROWS[0]!] });
    expect(result.current.count).toBe(0);
    rerender({ rows: ROWS });
    expect(result.current.isSelected('3')).toBe(true);
  });

  it('tracks all / some / none for the header checkbox', () => {
    const { result } = renderHook(() => useRowSelection(ROWS, (r) => r.id));
    expect(result.current.allSelected).toBe(false);
    expect(result.current.someSelected).toBe(false);

    act(() => result.current.toggle('1'));
    expect(result.current.someSelected).toBe(true);
    expect(result.current.allSelected).toBe(false);

    act(() => result.current.toggleAll());
    expect(result.current.allSelected).toBe(true);
    expect(result.current.someSelected).toBe(false);
  });

  it('stops claiming "all" when more rows load', () => {
    const { result, rerender } = renderHook(
      ({ rows }: { rows: Row[] }) => useRowSelection(rows, (r) => r.id),
      { initialProps: { rows: [ROWS[0]!] } },
    );
    act(() => result.current.toggleAll());
    expect(result.current.allSelected).toBe(true);
    rerender({ rows: ROWS });
    expect(result.current.allSelected).toBe(false);
  });

  it('clears only what is on screen when everything on screen is ticked', () => {
    const { result, rerender } = renderHook(
      ({ rows }: { rows: Row[] }) => useRowSelection(rows, (r) => r.id),
      { initialProps: { rows: ROWS } },
    );
    act(() => result.current.toggleAll());
    rerender({ rows: [ROWS[0]!] });
    act(() => result.current.toggleAll()); // clears row 1 only
    rerender({ rows: ROWS });
    expect([...result.current.selectedIds].sort()).toEqual(['2', '3']);
  });

  it('keeps its object identity when the derived selection has not changed', () => {
    /**
     * Load-bearing, not a micro-optimisation. This object reaches DataTable's
     * memoised rows, so a hook that re-identified per render would turn that memo
     * into dead code , and a hundred rows, each formatting a date and mounting a
     * switch and a menu, would re-render on every keystroke in the filter box.
     */
    const { result, rerender } = renderHook(
      ({ rows }: { rows: Row[] }) => useRowSelection(rows, (r) => r.id),
      { initialProps: { rows: ROWS } },
    );
    const first = result.current;
    rerender({ rows: [...ROWS] }); // new array, same contents, nothing selected
    expect(result.current.selectedIds).toBe(first.selectedIds);
  });

  it('does not re-identify when an inline getId arrow changes', () => {
    /** It is read from a ref, so a fresh closure at the call site costs nothing. */
    const { result, rerender } = renderHook(() => useRowSelection(ROWS, (r) => r.id));
    const first = result.current.selectedIds;
    rerender();
    expect(result.current.selectedIds).toBe(first);
  });

  it('clears everything, including off-screen', () => {
    const { result, rerender } = renderHook(
      ({ rows }: { rows: Row[] }) => useRowSelection(rows, (r) => r.id),
      { initialProps: { rows: ROWS } },
    );
    act(() => result.current.toggleAll());
    rerender({ rows: [ROWS[0]!] });
    act(() => result.current.clear());
    rerender({ rows: ROWS });
    expect(result.current.count).toBe(0);
  });
});

describe('DataTable, the surface passthrough', () => {
  /**
   * `surface` existed on `Table` from the start and was missing here, which meant
   * the component MOST likely to be dropped inside a Card was the one that could
   * not opt out of glass. It was not reachable through the prop spread either:
   * `surface` is not part of `React.ComponentProps<'table'>`, so there was no
   * type-level path to it at all.
   */
  const wrapper = (container: HTMLElement) =>
    container.querySelector('[data-slot="table-container"]')!.className;

  const renderWith = (surface?: 'glass' | 'panel' | 'none') =>
    render(
      <DataTable
        label="Flags"
        columns={COLUMNS}
        rows={ROWS}
        rowKey={(row: Row) => row.id}
        context={CTX}
        surface={surface}
      />,
    );

  it('still defaults to glass when the prop is omitted', () => {
    expect(wrapper(renderWith().container)).toContain('glass-surface');
  });

  it('drops the surface on surface="none", for a table inside a Card or Dialog', () => {
    /**
     * The nested-glass case `glass.css` forbids: an inner glass surface composites
     * over the outer one, the two land ~2/255 apart, and both stop reading as a
     * material while costing two paints.
     */
    expect(wrapper(renderWith('none').container)).not.toContain('glass-surface');
  });

  it('takes the opaque panel on surface="panel"', () => {
    const cls = wrapper(renderWith('panel').container);
    expect(cls).toContain('bg-panel');
    expect(cls).not.toContain('glass-surface');
  });

  it('never mounts a blur, at any surface value', () => {
    /**
     * The wrapper is `overflow-x-auto`. `backdrop-filter` on a scroll container
     * establishes a containing block for fixed descendants and forms a stacking
     * context, which is why `glass.css` forbids blur here specifically.
     */
    for (const surface of [undefined, 'glass', 'panel', 'none'] as const) {
      expect(wrapper(renderWith(surface).container), `surface="${surface}"`).not.toContain(
        'glass-surface-blur',
      );
    }
  });
});

describe('DataTable, axe', () => {
  it('finds no violations on a sortable, selectable, activatable table', async () => {
    const columns: DataTableColumn<Row, Ctx>[] = [
      {
        id: 'select',
        header: 'Select',
        hideHeader: true,
        interactive: true,
        headerCell: () => <Checkbox aria-label="Select all rows" />,
        cell: (row) => <Checkbox aria-label={`Select ${row.key}`} />,
      },
      ...COLUMNS,
    ];
    const violations = await audit(
      <DataTable
        label="Flags in Production"
        columns={columns}
        rows={ROWS}
        rowKey={(row) => row.id}
        context={CTX}
        sort={{ key: 'key', dir: 'asc' }}
        onSortChange={() => {}}
        onRowActivate={() => {}}
        rowLabel={(row) => row.key}
        isRowSelected={(row) => row.id === '1'}
      />,
    );
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });

  it('finds no violations on the empty state', async () => {
    const violations = await audit(
      <DataTable
        label="Flags in Production"
        columns={COLUMNS}
        rows={[]}
        rowKey={(row: Row) => row.id}
        context={CTX}
        empty={<EmptyState title="No flags match this filter" />}
      />,
    );
    expect(violations.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
