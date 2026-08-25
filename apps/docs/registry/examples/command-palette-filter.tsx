'use client';

import { useCallback, useState } from 'react';

import {
  Button,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@velobitsio/ui';
import { FlagIcon } from '@velobitsio/icons';

/**
 * The thing being SEARCHED is not the thing being SHOWN.
 *
 * Each row displays a human name and carries a slug, an owning team and a
 * previous name nobody has finished renaming. All three should match; none of
 * them is on screen.
 *
 * cmdk scores `value`, and it also accepts `keywords` on an item , so reaching
 * hidden terms at all is not the problem. RANKING them is. Both routes feed one
 * string to `command-score` (`value + " " + keywords.join(" ")`), so a hit deep
 * in a stale alias scores like a hit on the name, and the dilution gets worse
 * the more aliases a row carries. A `filter` is the only place to say that a
 * name match outranks an alias match.
 *
 * `filter` is a cmdk ROOT prop, so it goes on the palette, not on an item , and
 * `CommandDialog` renders the palette internally. It is one of the props the
 * component names and routes there explicitly.
 */
const FLAGS = [
  { id: 'checkout', name: 'New checkout', aliases: ['new-checkout', 'payments', 'flow-v2'] },
  { id: 'bulk', name: 'Bulk selection', aliases: ['bulk-selection', 'platform', 'multi-select'] },
  { id: 'launch', name: 'Dark launch', aliases: ['dark-launch', 'growth', 'silent-ship'] },
];

export default function CommandPaletteFilter() {
  const [open, setOpen] = useState(false);

  /**
   * Returns 0..1, 1 being the best match. Scored so a name match always beats an
   * alias match, which is the ranking `value`-stuffing cannot express.
   *
   * `useCallback` here is hygiene, not a fix. cmdk keeps props in a ref and
   * reads `filter` lazily, so a new function identity does NOT re-run the
   * filter , the gotcha runs the other way: changing `filter` does not re-filter
   * what is already on screen. If yours closes over state that can change, drive
   * it through the search string or remount the palette.
   */
  const filter = useCallback((value: string, search: string) => {
    const query = search.trim().toLowerCase();
    // cmdk calls this at registration with an empty search, and with the GROUP's
    // value too, but short-circuits on an empty query before the score is used.
    if (!query) return 1;
    const flag = FLAGS.find((f) => f.id === value);
    if (!flag) return 0;
    if (flag.name.toLowerCase().includes(query)) return 1;
    if (flag.aliases.some((alias) => alias.includes(query))) return 0.5;
    return 0;
  }, []);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Find a flag
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen} filter={filter} label="Flag search">
        {/* Try “payments”, “growth” or “v2” , none of them is visible below. */}
        <CommandInput placeholder="Name, slug, team or old name…" />
        <CommandList>
          <CommandEmpty>No flags match.</CommandEmpty>
          <CommandGroup heading="Flags">
            {FLAGS.map((flag) => (
              <CommandItem key={flag.id} value={flag.id} onSelect={() => setOpen(false)}>
                <FlagIcon />
                {flag.name}
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
