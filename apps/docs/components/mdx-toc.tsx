'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

import { DocsToc, type TocEntry } from './docs-toc';

/**
 * "On this page" for a guide, scanned from the rendered DOM.
 *
 * ## Why it is not collected at build time
 *
 * The right way is a remark plugin that walks the headings and exports them, and
 * it is not available here: Next 16 builds with Turbopack, which serialises
 * loader options across a process boundary, so a plugin can only be named as a
 * STRING and a local function is rejected outright. (The same constraint is
 * documented on the two plugins in `next.config.mjs`.) `rehype-slug` gives the
 * headings ids from a published package; reading them back is left to the client.
 *
 * The cost is honest and small: on a statically exported page this column is
 * absent from the HTML and appears on hydration. It is a secondary navigation
 * aid for prose that is a screen or two long, and every heading it would list is
 * already visible by scrolling. The component pages , which are the ones with
 * fifteen sections , build their table of contents at build time from the data
 * they render, and do not go through here.
 *
 * Re-scans on pathname change: a client navigation between two guides swaps the
 * content without remounting this, so a `[]` dependency list would leave the
 * previous page's headings on screen.
 */
export function MdxToc() {
  const pathname = usePathname();
  const [entries, setEntries] = useState<TocEntry[]>([]);

  useEffect(() => {
    const headings = document.querySelectorAll<HTMLHeadingElement>('#main h2[id], #main h3[id]');
    setEntries(
      Array.from(headings).map((heading) => ({
        id: heading.id,
        title: heading.textContent ?? heading.id,
        level: heading.tagName === 'H3' ? 3 : 2,
      })),
    );
  }, [pathname]);

  return <DocsToc entries={entries} />;
}
