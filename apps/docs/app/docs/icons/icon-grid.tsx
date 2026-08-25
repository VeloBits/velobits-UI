'use client';

import { useCallback, useMemo, useState } from 'react';

import { SearchIcon, type Icon as IconComponent } from '@velobitsio/icons';
import { Badge, EmptyState, Input } from '@velobitsio/ui';

import { IconDetailDialog } from './icon-detail-dialog';
import { ICONS } from './icons-data';

function Swatch({
  name,
  Icon,
  onOpen,
}: {
  name: string;
  Icon: IconComponent;
  onOpen: (name: string) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onOpen(name)}
      /*
       * A real button, so it is focusable and Enter/Space activate it for free.
       * The accessible name carries the OUTCOME rather than the icon's name ,
       * "TrashIcon" alone does not say that activating this opens anything.
       */
      aria-label={`Configure ${name}`}
      aria-haspopup="dialog"
      className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border p-3 transition-colors duration-micro ease-out hover:bg-highlight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      <Icon size={20} />
      <code className="w-full truncate text-center text-[11px] text-muted-foreground" title={name}>
        {name.replace(/Icon$/, '')}
      </code>
    </button>
  );
}

/**
 * The searchable grid.
 *
 * The list itself lives in ./icons-data, which carries no client directive, so
 * the server-rendered page can read ICON_COUNT as a real number. That file
 * records what happens when such a value crosses this boundary instead.
 *
 * ## A tile opens the playground; it no longer copies
 *
 * Clicking a tile used to write `import { TrashIcon } from '@velobitsio/icons'`
 * to the clipboard and flip to a tick. That was a one-click answer to the wrong
 * question: the import line is the part nobody gets wrong, while `size`,
 * `strokeWidth` and the three-prop `aria-hidden` opt-out are the parts that are
 * either guessed or copied from a neighbouring file. `IconDetailDialog` is where
 * those live, and the import line is still one tab inside it.
 *
 * ## Selection is a name, not an index
 *
 * `matches` is recomputed from `query`, so an index into it means something
 * different every keystroke, and a stored index would point at a different glyph
 * the moment the filter changed. The name is stable under filtering.
 */
export function IconGrid() {
  const [query, setQuery] = useState('');

  /*
   * Two pieces of state, not one nullable.
   *
   * `shown` is never cleared on close. Radix keeps the content mounted for the
   * duration of the exit animation, so nulling the icon on close would blank the
   * dialog out mid-fade; and because `IconDetailDialog` is therefore never keyed
   * by name and never unmounts, the configuration you set survives closing and
   * reopening it. That persistence is the feature, not an accident of where the
   * state sits.
   */
  const [shown, setShown] = useState<string | null>(null);
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return ICONS;
    return ICONS.filter(([name]) => name.toLowerCase().includes(needle));
  }, [query]);

  const openIcon = useCallback((name: string) => {
    setShown(name);
    setOpen(true);
  }, []);

  const shownEntry = shown ? ICONS.find(([name]) => name === shown) : undefined;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <Input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Filter icons…"
          aria-label="Filter icons"
          className="max-w-xs"
        />
        <Badge variant="neutral" aria-live="polite">
          {matches.length} of {ICONS.length}
        </Badge>
        <span className="text-sm text-muted-foreground">
          Click a glyph to size, colour and copy it.
        </span>
      </div>

      {matches.length > 0 ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {matches.map(([name, Icon]) => (
            <Swatch key={name} name={name} Icon={Icon} onOpen={openIcon} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<SearchIcon />}
          title="No icon matches that"
          description="Names are the glyph plus an Icon suffix, so try 'trash', 'chevron' or 'flag'."
        />
      )}

      {shownEntry ? (
        <IconDetailDialog
          name={shownEntry[0]}
          Icon={shownEntry[1]}
          open={open}
          onOpenChange={setOpen}
        />
      ) : null}
    </div>
  );
}
