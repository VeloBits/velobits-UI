'use client';

import { useEffect, useState } from 'react';

import {
  Button,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Spinner,
} from '@velobitsio/ui';
import { FlagIcon } from '@velobitsio/icons';

/** Stands in for the endpoint. Matches on the key OR the description. */
const FLAGS = [
  { key: 'new-checkout', description: 'Routes checkout through the new flow' },
  { key: 'bulk-selection', description: 'Multi-row actions on the flags table' },
  { key: 'dark-launch', description: 'Ships disabled, enabled per environment' },
];

function search(query: string): Promise<typeof FLAGS> {
  const q = query.trim().toLowerCase();
  return new Promise((resolve) =>
    setTimeout(
      () =>
        resolve(
          q
            ? FLAGS.filter((f) => f.key.includes(q) || f.description.toLowerCase().includes(q))
            : FLAGS,
        ),
      250,
    ),
  );
}

/**
 * `shouldFilter={false}` , a cmdk root prop, so it reaches the palette only
 * because `CommandDialog` names and routes it there. The component renders two
 * roots and the rest spread goes to the Dialog.
 *
 * This is the prop a server-backed palette needs. The results are already the
 * answer; leaving cmdk's client-side pass on filters the response a second time
 * against the same query and hides rows the server deliberately returned , most
 * visibly a fuzzy or synonym match the server understood and `command-score`
 * does not.
 *
 * ## `CommandEmpty` still works. It changes MEANING.
 *
 * The tempting assumption is that filtering off leaves cmdk with nothing to
 * count, so the empty state has to be hand-rolled. It does not: cmdk's counter
 * short-circuits when `shouldFilter === false` and reports the number of
 * REGISTERED items instead. So `CommandEmpty` stops asking "did the query match
 * anything" and starts asking "did you render anything", which for a remote
 * palette is the better question , and hand-rolling a second empty state beside
 * it renders BOTH.
 *
 * The corollary is the group: `CommandGroup` is force-visible with filtering
 * off, so an unconditional one leaves a heading standing over nothing. Render it
 * only when there are rows.
 */
export default function CommandPaletteRemote() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<typeof FLAGS>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    search(query).then((flags) => {
      if (cancelled) return;
      setResults(flags);
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [open, query]);

  return (
    <>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Search flags
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen} shouldFilter={false} label="Flag search">
        <CommandInput
          placeholder="Try “checkout”, or “table”…"
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {/*
           * One empty state, cmdk's, carrying both messages. With filtering off
           * it renders whenever no items are registered, which covers the first
           * fetch and a genuine no-match alike.
           *
           * The spinner is only seen when there is nothing to show yet: a
           * re-search keeps the previous rows on screen, so the count is not
           * zero and this does not render. That is deliberate , swapping a full
           * list for a spinner on every keystroke is worse than letting the
           * stale rows sit for 250ms.
           */}
          <CommandEmpty>
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <Spinner size={14} label={null} />
                Searching…
              </span>
            ) : (
              'No flags match.'
            )}
          </CommandEmpty>
          {/*
           * Conditional, because a CommandGroup is force-visible while filtering
           * is off , rendered unconditionally it leaves the heading standing
           * over an empty list.
           */}
          {results.length > 0 && (
            <CommandGroup heading="Flags">
              {results.map((flag) => (
                <CommandItem key={flag.key} value={flag.key} onSelect={() => setOpen(false)}>
                  <FlagIcon />
                  {flag.key}
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
