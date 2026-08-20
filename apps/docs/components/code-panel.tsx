/*
 * `@velobitsio/ui/cn`, not the barrel.
 *
 * This is a Server Component, and the barrel is bundled with a `'use client'`
 * banner , so importing `cn` from it and CALLING it fails the build with
 * "Attempted to call cn() from the server but cn is on the client". Rendering a
 * client component from here is fine; invoking a function out of a client module
 * is not.
 *
 * `cn` and `theme` are built as a separate, un-bannered tsup entry for exactly
 * this: they are React-free and callable during server render. The subpath is the
 * whole point of that split.
 */
import { cn } from '@velobitsio/ui/cn';

import { CopyButton } from './copy-button';

/**
 * A block of code that was highlighted at build time by
 * `scripts/build-docs-data.ts`.
 *
 * `dangerouslySetInnerHTML` is load-bearing and safe here: the markup is Shiki's
 * output for a file in this repository, produced during the build. Nothing on
 * this page is ever user input, and there is no runtime path that reaches this
 * prop , the alternative, shipping the highlighter to the browser, costs every
 * reader a megabyte of grammars to render text that never changes.
 *
 * The dual-theme CSS lives in `app/globals.css`: Shiki emits `--shiki-light` and
 * `--shiki-dark` per token rather than a baked colour, so one payload serves both
 * themes and the code recolours with the rest of the page rather than after it.
 */
export function CodePanel({
  html,
  source,
  label,
  className,
  maxHeight,
}: {
  html: string;
  /** The literal text, so the copy button copies code and not markup. */
  source: string;
  label?: string;
  className?: string;
  /** Caps the height and scrolls, for a full component source. */
  maxHeight?: string;
}) {
  return (
    <div
      className={cn(
        'group/code relative overflow-hidden rounded-lg border border-border',
        className,
      )}
    >
      <CopyButton
        value={source}
        label={label ? `Copy ${label}` : 'Copy code'}
        className="absolute end-2 top-2 z-raised bg-panel/80 backdrop-blur-sm"
      />
      <div
        role={label ? 'region' : undefined}
        aria-label={label}
        className={cn(
          'text-[0.8125rem] leading-relaxed',
          /*
           * ⚠️ The `<pre>` is the scroll container, NOT this wrapper.
           *
           * Shiki paints the block's background on the `<pre>` (as
           * `--shiki-*-bg`), and a background only ever covers the element's own
           * box. A `<pre>` is a block, so inside a scrolling wrapper it is exactly
           * as wide as that wrapper , meaning the moment you scrolled right, the
           * code ran off the end of its own fill and the page showed through, with
           * a matching strip under the horizontal scrollbar, which belongs to the
           * wrapper and never had the fill at all.
           *
           * Scrolling the painted element instead fixes both: its background is
           * the padding box, which is what stays put while the content moves, and
           * the scrollbar gutter is inside it. `w-max` on the `<pre>` would fix
           * only the first half.
           */
          '[&_pre]:overflow-auto [&_pre]:p-4 [&_pre]:font-mono',
          /*
           * Shiki's own output already carries `tabindex="0"`, so the element that
           * scrolls is the element that focuses (2.1.1) with nothing added here.
           * The offset goes INWARD because the rounded wrapper clips overflow, and
           * a 2px outline drawn outside the `<pre>` is a 2px outline nobody sees.
           */
          '[&_pre]:focus-visible:-outline-offset-2',
          maxHeight && '[&_pre]:max-h-[var(--code-panel-max-h)]',
        )}
        style={maxHeight ? ({ '--code-panel-max-h': maxHeight } as React.CSSProperties) : undefined}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
