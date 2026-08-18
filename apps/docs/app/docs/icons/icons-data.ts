import * as iconModule from '@velobitsio/icons';
import { type Icon as IconComponent } from '@velobitsio/icons';

/**
 * The icon list, and the count derived from it.
 *
 * ## Why this is its own module
 *
 * This file deliberately carries NO `'use client'`. It used to live in
 * `icon-grid.tsx`, which does, and `page.tsx` is a server component that
 * imported `ICON_COUNT` from it.
 *
 * Every export of a `'use client'` module becomes a client *reference* when a
 * server component imports it, including plain values. React hands back a proxy
 * that throws when called, so `${ICON_COUNT}` in a template literal stringified
 * the proxy's source and the page heading rendered as:
 *
 *     The set - function(){throw Error("Attempted to call ICON_COUNT() from the
 *     server but ICON_COUNT is on the client...")} icons
 *
 * The number was never wrong; it was never a number on the server at all. With
 * the list in a boundary-neutral module both graphs import the value directly
 * and nothing is proxied.
 *
 * ## It enumerates the module, not a list
 *
 * `import * as iconModule` and filter, using the same predicate
 * `packages/icons/test/icons.test.tsx` uses, so a newly exported icon appears
 * on the page the moment it ships and nobody edits a literal array.
 *
 * `createIcon` has to be excluded BY NAME rather than by shape: it is a function
 * whose name ends in `Icon`, so a bare `endsWith('Icon')` counts one too many.
 */
export const ICONS = Object.entries(iconModule)
  .filter(
    (entry): entry is [string, IconComponent] =>
      entry[0].endsWith('Icon') && entry[0] !== 'createIcon' && typeof entry[1] === 'function',
  )
  .sort(([a], [b]) => a.localeCompare(b));

export const ICON_COUNT = ICONS.length;
