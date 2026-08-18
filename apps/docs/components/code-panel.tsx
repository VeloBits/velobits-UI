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
        /*
         * Focusable because it scrolls. A scroll container that keyboard users
         * cannot reach is 2.1.1 , and this one scrolls by construction, since
         * code does not wrap.
         */
        tabIndex={0}
        role={label ? 'region' : undefined}
        aria-label={label}
        className="overflow-auto text-[0.8125rem] leading-relaxed [&_pre]:p-4 [&_pre]:font-mono"
        style={maxHeight ? { maxHeight } : undefined}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
