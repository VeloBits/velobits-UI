import { DocsSidebarNav } from '@/components/docs-sidebar';

/**
 * The three-column docs shell: sidebar, content, "On this page".
 *
 * Each page supplies its own table of contents rather than this layout deriving
 * one, because the two page shapes have different sources for it , MDX guides
 * know their headings at authoring time, and `[slug]` builds them from which
 * sections it decided to render. A layout that scraped the DOM for headings
 * would work for both and only in the browser, which on a statically exported
 * site means the column is empty in the HTML and pops in after hydration.
 *
 * `lg:sticky` and not `fixed`: a fixed sidebar leaves the page scrolled behind
 * it and needs its own scroll container plus a matching content offset. Sticky
 * inside a grid track gets the same result from the layout that is already there.
 */
export default function DocsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-screen-2xl px-4 sm:px-6">
      <div className="lg:grid lg:grid-cols-[16rem_minmax(0,1fr)] lg:gap-10">
        {/*
         * Native overflow, deliberately, and NOT the ScrollArea this library
         * ships. Radix enables the viewport scroll on mount, unconditionally:
         * `overflowY: scrollbarYEnabled ? "scroll" : "hidden"`, where
         * `scrollbarYEnabled` is set by an effect in ScrollAreaScrollbar the
         * moment it renders, regardless of `type` and regardless of whether the
         * content overflows.
         *
         * So a nav short enough to fit becomes a scroll container with nothing to
         * scroll: the wheel is captured, the page does not move, and it lurches
         * once the chain finally reaches the document. `overflow-y-auto` only
         * becomes a scroller when it needs to be, which is the right behaviour for
         * content whose length depends on the page.
         *
         * ScrollArea is for a box that always overflows and has a height of its
         * own. See /docs/components/scroll-area.
         */}
        <aside className="hidden lg:sticky lg:top-14 lg:block lg:h-[calc(100dvh-3.5rem)] lg:overflow-y-auto lg:py-8">
          <DocsSidebarNav />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
