'use client';

import { useMemo, useState } from 'react';

import {
  Button,
  Checkbox,
  DataTable,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  EmptyState,
  Input,
  StatusChip,
  useRowSelection,
  type DataTableColumn,
  type RowSelection,
  type SortState,
  type Status,
} from '@velobits/ui';
import { ArchiveIcon, EllipsisIcon, PlusIcon, SearchIcon, SlidersIcon } from '@velobits/icons';

interface FlagRow {
  id: string;
  key: string;
  status: Status;
  env: string;
  owner: string;
  updated: string;
}

const FLAG_ROWS: readonly FlagRow[] = [
  {
    id: '1',
    key: 'new-checkout',
    status: 'partial',
    env: 'Production',
    owner: 'Payments',
    updated: '2026-08-05',
  },
  {
    id: '2',
    key: 'dark-mode-rollout',
    status: 'on',
    env: 'Production',
    owner: 'Platform',
    updated: '2026-08-03',
  },
  {
    id: '3',
    key: 'beta-search',
    status: 'pending',
    env: 'Staging',
    owner: 'Discovery',
    updated: '2026-08-05',
  },
  {
    id: '4',
    key: 'legacy-export',
    status: 'off',
    env: 'Staging',
    owner: 'Platform',
    updated: '2026-07-28',
  },
  {
    id: '5',
    key: 'inline-editing',
    status: 'partial',
    env: 'Development',
    owner: 'Editor',
    updated: '2026-08-06',
  },
  {
    id: '6',
    key: 'usage-quotas',
    status: 'on',
    env: 'Production',
    owner: 'Billing',
    updated: '2026-08-01',
  },
  {
    id: '7',
    key: 'old-onboarding',
    status: 'archived',
    env: 'Production',
    owner: 'Growth',
    updated: '2026-06-14',
  },
  {
    id: '8',
    key: 'webhook-retries',
    status: 'off',
    env: 'Development',
    owner: 'Platform',
    updated: '2026-07-19',
  },
];

interface FlagTableContext {
  selection: RowSelection;
}

const FLAG_COLUMNS: readonly DataTableColumn<FlagRow, FlagTableContext>[] = [
  {
    id: 'select',
    // `hideHeader`, never an empty <th> — axe `empty-table-header`, and a screen
    // reader would otherwise announce every checkbox with no idea what it does.
    header: 'Select row',
    hideHeader: true,
    interactive: true,
    className: 'w-10',
    headerCell: (ctx) => (
      <Checkbox
        aria-label="Select all rows"
        checked={
          ctx.selection.allSelected ? true : ctx.selection.someSelected ? 'indeterminate' : false
        }
        onCheckedChange={() => ctx.selection.toggleAll()}
      />
    ),
    cell: (row, ctx) => (
      <Checkbox
        aria-label={`Select ${row.key}`}
        checked={ctx.selection.isSelected(row.id)}
        onCheckedChange={() => ctx.selection.toggle(row.id)}
      />
    ),
  },
  {
    id: 'key',
    header: 'Key',
    sortKey: 'key',
    cell: (row) => <code className="font-medium">{row.key}</code>,
  },
  {
    id: 'status',
    header: 'State',
    sortKey: 'status',
    cell: (row) => <StatusChip status={row.status} />,
  },
  { id: 'env', header: 'Environment', sortKey: 'env', cell: (row) => row.env },
  { id: 'owner', header: 'Owner', sortKey: 'owner', cell: (row) => row.owner },
  {
    id: 'updated',
    header: 'Updated',
    sortKey: 'updated',
    cell: (row) => <span className="tabular-nums">{row.updated}</span>,
  },
  {
    id: 'actions',
    header: 'Actions',
    hideHeader: true,
    interactive: true,
    className: 'w-10',
    cell: (row) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost" aria-label={`Actions for ${row.key}`}>
            <EllipsisIcon />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuItem>Duplicate</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="danger">Archive</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

export default function DataTableDemo() {
  const [sort, setSort] = useState<SortState>({ key: 'updated', dir: 'desc' });
  const [query, setQuery] = useState('');
  const [activated, setActivated] = useState<string | null>(null);

  const rows = useMemo(() => {
    const needle = query.trim().toLowerCase();
    const filtered = needle
      ? FLAG_ROWS.filter(
          (row) =>
            row.key.toLowerCase().includes(needle) || row.owner.toLowerCase().includes(needle),
        )
      : FLAG_ROWS;

    return [...filtered].sort((a, b) => {
      const key = sort.key as keyof FlagRow;
      const result = String(a[key]).localeCompare(String(b[key]));
      return sort.dir === 'asc' ? result : -result;
    });
  }, [query, sort]);

  const selection = useRowSelection(rows, (row) => row.id);
  const context = useMemo(() => ({ selection }), [selection]);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          className="max-w-xs"
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter by key or owner…"
          aria-label="Filter flags"
        />
        <Button variant="secondary" size="sm">
          <SlidersIcon />
          Columns
        </Button>
        <Button variant="primary" size="sm" className="ms-auto">
          <PlusIcon />
          New flag
        </Button>
      </div>

      {/*
       * The bulk bar appears only with a selection, which is also the honest demo
       * of `useRowSelection` — clear it by filtering the rows away.
       */}
      {selection.count > 0 && (
        <div
          className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-primary-soft px-3 py-2 text-sm"
          role="status"
        >
          <span className="font-medium text-primary-text">
            {selection.count} flag{selection.count === 1 ? '' : 's'} selected
          </span>
          <Button variant="secondary" size="sm">
            Enable
          </Button>
          <Button variant="secondary" size="sm">
            <ArchiveIcon />
            Archive
          </Button>
          <Button variant="ghost" size="sm" className="ms-auto" onClick={selection.clear}>
            Clear
          </Button>
        </div>
      )}

      {/*
       * No `containerClassName` border here. `Table` defaults to
       * `surface="glass"`, and a `border-*` utility on that wrapper wins the
       * cascade over `.glass-surface`'s own translucent edge — silently swapping
       * the material's border for the opaque one.
       */}
      <DataTable
        label="Flags in Acme · all environments"
        columns={FLAG_COLUMNS}
        rows={rows}
        rowKey={(row) => row.id}
        context={context}
        sort={sort}
        onSortChange={(next) => setSort(next)}
        onRowActivate={(row) => setActivated(row.key)}
        rowLabel={(row) => `Open ${row.key}`}
        isRowSelected={(row) => selection.isSelected(row.id)}
        empty={
          <EmptyState
            size="compact"
            icon={<SearchIcon />}
            title="No flags match that filter"
            description="Try a shorter search, or clear it to see all eight."
            action={
              <Button variant="secondary" size="sm" onClick={() => setQuery('')}>
                Clear filter
              </Button>
            }
          />
        }
      />

      <p className="text-sm text-muted-foreground" aria-live="polite">
        {rows.length} of {FLAG_ROWS.length} shown · {selection.count} selected
        {activated ? ` · last opened: ${activated}` : ''}
      </p>
    </div>
  );
}
