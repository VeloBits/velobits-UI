'use client';

import { useMemo, useState } from 'react';

import { CheckIcon, SearchIcon, type Icon as IconComponent } from '@velobitsio/icons';
import { Badge, EmptyState, Input } from '@velobitsio/ui';

import { ICONS } from './icons-data';

function Swatch({ name, Icon }: { name: string; Icon: IconComponent }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!navigator.clipboard) return;
    await navigator.clipboard.writeText(`import { ${name} } from '@velobitsio/icons';`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={copy}
      /*
       * A real button, so it is focusable and Enter/Space activate it for free.
       * The accessible name carries the OUTCOME rather than the icon's name ,
       * "TrashIcon" alone does not say that activating this copies anything.
       */
      aria-label={copied ? `Copied import for ${name}` : `Copy import for ${name}`}
      className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border p-3 transition-colors duration-micro ease-out hover:bg-highlight focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
    >
      {copied ? <CheckIcon size={20} className="text-success" /> : <Icon size={20} />}
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
 */
export function IconGrid() {
  const [query, setQuery] = useState('');

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return ICONS;
    return ICONS.filter(([name]) => name.toLowerCase().includes(needle));
  }, [query]);

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
          Click a glyph to copy its import line.
        </span>
      </div>

      {matches.length > 0 ? (
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8">
          {matches.map(([name, Icon]) => (
            <Swatch key={name} name={name} Icon={Icon} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<SearchIcon />}
          title="No icon matches that"
          description="Names are the glyph plus an Icon suffix, so try 'trash', 'chevron' or 'flag'."
        />
      )}
    </div>
  );
}
