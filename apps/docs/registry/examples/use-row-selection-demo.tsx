'use client';

import { useMemo, useState } from 'react';

import { Badge, Button, Checkbox, Input, Label, useRowSelection } from '@velobits/ui';

const FLAGS = [
  { id: '1', key: 'new-checkout' },
  { id: '2', key: 'dark-mode-rollout' },
  { id: '3', key: 'beta-search' },
  { id: '4', key: 'legacy-export' },
];

/**
 * The point of this hook in one screen: the selection is DERIVED — the stored set
 * intersected with the rows currently on screen. Select every row, then filter
 * them away, and the count follows to zero rather than keeping a bulk action
 * pointed at rows nobody can see.
 */
export default function UseRowSelectionDemo() {
  const [query, setQuery] = useState('');
  const rows = useMemo(
    () => FLAGS.filter((f) => f.key.includes(query.trim().toLowerCase())),
    [query],
  );
  const selection = useRowSelection(rows, (row) => row.id);

  return (
    <div className="max-w-md space-y-3">
      <Input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Filter, and watch the count follow…"
        aria-label="Filter flags"
      />
      <div className="flex items-center gap-2 border-b border-border pb-2">
        <Checkbox
          id="urs-all"
          aria-label="Select all rows"
          checked={selection.allSelected ? true : selection.someSelected ? 'indeterminate' : false}
          onCheckedChange={() => selection.toggleAll()}
        />
        <Label htmlFor="urs-all">Select all</Label>
        <Badge variant="primary" className="ms-auto">
          {selection.count} selected
        </Badge>
      </div>
      <ul className="space-y-2">
        {rows.map((row) => (
          <li key={row.id} className="flex items-center gap-2">
            <Checkbox
              id={`urs-${row.id}`}
              checked={selection.isSelected(row.id)}
              onCheckedChange={() => selection.toggle(row.id)}
            />
            <Label htmlFor={`urs-${row.id}`}>
              <code>{row.key}</code>
            </Label>
          </li>
        ))}
      </ul>
      <Button variant="ghost" size="sm" onClick={selection.clear}>
        Clear
      </Button>
    </div>
  );
}
