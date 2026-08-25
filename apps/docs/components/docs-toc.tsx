'use client';

import { useEffect, useRef, useState } from 'react';

import { cn } from '@velobitsio/ui';

export interface TocEntry {
  id: string;
  title: string;
  /** 2 renders flush, 3 indents. Nothing deeper is worth a jump link. */
  level: 2 | 3;
}

/**
 * Matches `scroll-mt-24` on the headings, so the highlight changes at the same
 * moment a clicked jump link would land.
 */
const FOLD = 96 + 8;

/**
 * Slack for "the document is at its end" , and for "the document does not
 * really scroll", which a page that fits the viewport still misses by a pixel of
 * layout rounding.
 */
const SCROLL_EPSILON = 4;

/**
 * "On This Page", with the current section highlighted as you scroll.
 *
 * ## Why the observer is not the obvious one
 *
 * An `IntersectionObserver` that marks whatever last became visible picks the
 * WRONG heading when you scroll upward: the heading entering from the top is
 * reported at the same moment the one below it is still on screen, so the
 * highlight jumps ahead of where the reader is. It also lights nothing at all
 * when a section is taller than the viewport and no heading is intersecting.
 *
 * So this tracks every heading's position instead and picks the last one above
 * the fold line. That answer is defined at every scroll offset, including inside
 * a long section and at the very bottom of the page.
 *
 * ## Why scroll position alone is not enough
 *
 * The tail of a short page is ambiguous: once the document is scrolled as far as
 * it goes, the last heading may still sit well below the fold, so the rule above
 * can never name it and its link would never light up. The old fix , at the
 * bottom, force the last entry , overrode a perfectly good answer: on a page
 * whose second-to-last section already scrolls to the end, clicking
 * "Requirements" landed correctly and then lit "Usage".
 *
 * Both readings of that scroll offset are legitimate, so the tiebreak comes from
 * the reader instead: a clicked link (or an incoming `#hash`) pins its heading,
 * and the pin holds for exactly as long as it is still honest , while it is the
 * fold answer, or while it names a heading the page cannot scroll far enough to
 * bring to the fold at all. Scroll away and the pin is dropped on the next
 * frame, which is what puts plain scrolling back on the rule above.
 */
export function DocsToc({ entries }: { entries: TocEntry[] }) {
  const [activeId, setActiveId] = useState<string | null>(entries[0]?.id ?? null);
  /** The heading the reader asked for, until scrolling contradicts it. */
  const pinned = useRef<string | null>(null);
  const ticking = useRef(false);

  useEffect(() => {
    if (!entries.length) return;

    const update = () => {
      ticking.current = false;

      const maxScroll = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
      const atBottom = window.scrollY >= maxScroll - SCROLL_EPSILON;

      let current = entries[0]?.id ?? null;
      for (const entry of entries) {
        const element = document.getElementById(entry.id);
        if (!element) continue;
        if (element.getBoundingClientRect().top <= FOLD) current = entry.id;
      }

      const pin = pinned.current;
      const pinElement = pin ? document.getElementById(pin) : null;
      // Sits past the last scroll offset the page has, so the loop above can
      // never reach it and the pin is the only thing that can select it.
      const pinIsUnreachable =
        pinElement !== null &&
        pinElement.getBoundingClientRect().top + window.scrollY - FOLD > maxScroll;

      if (pin !== null && (pin === current || (pinIsUnreachable && atBottom))) {
        current = pin;
      } else {
        pinned.current = null;
        // Nobody asked for a section and the document is at its end: the trailing
        // headings below the fold are unreachable, and the last one is the one
        // the reader has arrived at. Skipped when nothing scrolls at all , there
        // the reader has not arrived anywhere and the first entry still holds.
        if (atBottom && maxScroll > SCROLL_EPSILON) {
          current = entries[entries.length - 1]?.id ?? current;
        }
      }

      setActiveId(current);
    };

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(update);
    };

    // Also covers a link from elsewhere on the page and the hash a deep link
    // arrives with. Re-clicking the link that is already in the URL fires no
    // `hashchange`, which is what the anchors' own onClick is for.
    const onHashChange = () => {
      const id = decodeURIComponent(window.location.hash.slice(1));
      pinned.current = entries.some((entry) => entry.id === id) ? id : null;
      update();
    };

    onHashChange();
    window.addEventListener('hashchange', onHashChange);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      window.removeEventListener('hashchange', onHashChange);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
    };
  }, [entries]);

  if (!entries.length) return null;

  return (
    <nav aria-label="On this page" className="space-y-2 text-sm">
      <p className="text-xs font-semibold tracking-wide text-fg uppercase">On this page</p>
      <ul className="space-y-1 border-s border-border">
        {entries.map((entry) => (
          <li key={entry.id}>
            <a
              href={`#${entry.id}`}
              onClick={() => {
                pinned.current = entry.id;
                setActiveId(entry.id);
              }}
              aria-current={activeId === entry.id ? 'true' : undefined}
              className={cn(
                '-ms-px block border-s ps-3 py-1 transition-colors duration-micro ease-out',
                entry.level === 3 && 'ps-6',
                activeId === entry.id
                  ? 'border-primary-text font-medium text-link'
                  : 'border-transparent text-muted-foreground hover:text-fg',
              )}
            >
              {entry.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
