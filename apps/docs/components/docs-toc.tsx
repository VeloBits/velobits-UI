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
 */
export function DocsToc({ entries }: { entries: TocEntry[] }) {
  const [activeId, setActiveId] = useState<string | null>(entries[0]?.id ?? null);
  const ticking = useRef(false);

  useEffect(() => {
    if (!entries.length) return;

    const update = () => {
      ticking.current = false;
      // Matches `scroll-mt-24` on the headings, so the highlight changes at the
      // same moment a clicked jump link would land.
      const fold = 96 + 8;
      let current = entries[0]?.id ?? null;

      for (const entry of entries) {
        const element = document.getElementById(entry.id);
        if (!element) continue;
        if (element.getBoundingClientRect().top <= fold) current = entry.id;
      }

      // The last section can be too short to ever reach the fold line, so at the
      // bottom of the document its link would never light up.
      if (window.innerHeight + window.scrollY >= document.body.offsetHeight - 4) {
        current = entries[entries.length - 1]?.id ?? current;
      }

      setActiveId(current);
    };

    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
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
