import Link from 'next/link';

import { Button } from '@velobits/ui';
import { ArrowRightIcon } from '@velobits/icons';

import { componentPager } from '@/lib/docs-nav';
import { registryItemsByName } from '@/lib/generated/registry-data';

/**
 * Previous/next across the component sidebar.
 *
 * Ends are rendered as an absent link rather than a wrapped one — a "next" that
 * silently returns you to the top of the list is worse than no next at all,
 * because it reads as more content rather than as the end of it.
 *
 * The chevron is mirrored by `rtl:rotate-180` rather than swapped for a
 * left-pointing glyph: direction here is genuinely directional, which is the case
 * the token layer's logical properties cannot decide for you.
 */
export function DocsPager({ name }: { name: string }) {
  const { prev, next } = componentPager(name);
  if (!prev && !next) return null;

  return (
    <nav
      aria-label="Pagination"
      className="flex items-center justify-between gap-4 border-t border-border pt-6"
    >
      {prev ? (
        <Button variant="secondary" asChild>
          <Link href={prev.href}>
            <ArrowRightIcon className="rotate-180 rtl:rotate-0" />
            {registryItemsByName[prev.name]?.title ?? prev.name}
          </Link>
        </Button>
      ) : (
        <span />
      )}
      {next ? (
        <Button variant="secondary" asChild className="ms-auto">
          <Link href={next.href}>
            {registryItemsByName[next.name]?.title ?? next.name}
            <ArrowRightIcon className="rtl:rotate-180" />
          </Link>
        </Button>
      ) : (
        <span />
      )}
    </nav>
  );
}
