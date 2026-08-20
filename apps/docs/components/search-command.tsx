'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  Button,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  Kbd,
} from '@velobitsio/ui';
import { SearchIcon } from '@velobitsio/icons';

interface SearchEntry {
  title: string;
  href: string;
  group: string;
  description: string;
}

/**
 * ⌘K search, built on the system's own `CommandPalette` , the docs are the first
 * consumer of every component they document, and this is the one that most
 * benefits from being used in anger.
 *
 * ## The index is fetched, not imported
 *
 * `/search-index.json` is written by `scripts/build-docs-data.ts` into `public/`,
 * so importing it would be one line shorter. It would also put every page's
 * title and description into the JS bundle of every page , paid for on first
 * load by every reader, to serve a feature most of them never open. Fetching on
 * first open costs one request, once, at the moment it is actually wanted.
 *
 * A failed fetch leaves the palette empty rather than throwing: search is not
 * how anyone gets around this site, and a modal that crashes the page is a worse
 * outcome than one that says it found nothing.
 */
export function SearchCommand() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [entries, setEntries] = useState<SearchEntry[] | null>(null);

  useEffect(() => {
    if (!open || entries) return;
    let cancelled = false;

    fetch('/search-index.json')
      .then((response) => (response.ok ? response.json() : []))
      .then((data: SearchEntry[]) => {
        if (!cancelled) setEntries(data);
      })
      .catch(() => {
        if (!cancelled) setEntries([]);
      });

    return () => {
      cancelled = true;
    };
  }, [open, entries]);

  const go = useCallback(
    (href: string) => {
      setOpen(false);
      router.push(href);
    },
    [router],
  );

  // Grouped in the order the index was built, which is the sidebar's order ,
  // so the palette and the sidebar answer "what is there" the same way.
  const groups = (entries ?? []).reduce<Record<string, SearchEntry[]>>((acc, entry) => {
    (acc[entry.group] ??= []).push(entry);
    return acc;
  }, {});

  return (
    <>
      <Button
        variant="secondary"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2 text-muted-foreground"
      >
        <SearchIcon />
        <span className="hidden sm:inline">Search documentation…</span>
        <span className="hidden items-center gap-1 sm:flex">
          <Kbd>⌘</Kbd>
          <Kbd>K</Kbd>
        </span>
      </Button>

      {/*
       * `shortcut="k"` is the component's opt-in global binding. This site is the
       * one place it is correct to take ⌘K , which is also why the
       * CommandPalette demo page binds ⌘J instead: two listeners on one chord
       * means whichever mounted last wins, and the demo would steal the site's.
       */}
      <CommandDialog open={open} onOpenChange={setOpen} shortcut="k">
        <CommandInput placeholder="Search components, guides and tokens…" />
        <CommandList>
          <CommandEmpty>{entries === null ? 'Loading…' : 'No results.'}</CommandEmpty>
          {Object.entries(groups).map(([group, items]) => (
            <CommandGroup key={group} heading={group}>
              {items.map((entry) => (
                <CommandItem
                  key={entry.href}
                  /*
                   * cmdk matches on `value`, so the description has to be in it
                   * or searching for "bulk selection" finds nothing while the
                   * words sit visibly on screen.
                   */
                  value={`${entry.title} ${entry.description}`}
                  onSelect={() => go(entry.href)}
                >
                  {/*
                   * Stacked, not side by side. On one row the title and the
                   * description were a weight change and a colour change apart,
                   * which is not enough to parse at a glance, and a title long
                   * enough to wrap ("Theme resolution") pushed the description
                   * onto a second line at a different indent, so the column the
                   * eye was following disappeared.
                   *
                   * min-w-0 is load-bearing: a flex child defaults to min-content
                   * width, so without it `truncate` never engages and a long
                   * description widens the dialog instead of ellipsing.
                   */}
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate font-medium">{entry.title}</span>
                    {entry.description && (
                      <span className="truncate text-xs text-muted-foreground">
                        {entry.description}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          ))}
        </CommandList>
      </CommandDialog>
    </>
  );
}
