'use client';

import { useEffect } from 'react';
import Link from 'next/link';

import { Button, CodeBlock } from '@velobitsio/ui';
import { ArrowRightIcon, RotateCcwIcon } from '@velobitsio/icons';

/**
 * The route error boundary: anything under `app/` that throws while rendering in
 * the browser lands here, with the root layout still around it.
 *
 * ## What this can and cannot catch
 *
 * The site is a static export, so a page that throws during the BUILD fails the
 * build , there is no server left to render a 500 at request time, and no
 * arrangement in which a reader sees one. What reaches this file is therefore
 * runtime only: a client component throwing, a chunk that failed to load, a
 * hydration error, or an exception inside an event handler during render.
 *
 * An error in the root layout itself is not covered here, because this component
 * renders inside it. That is `app/global-error.tsx`.
 *
 * ## Two buttons, because `reset()` is not a reload
 *
 * `reset()` re-renders the segment, which fixes a transient failure and does
 * nothing at all for a module that threw while evaluating , the error simply
 * returns. So the second button exists, and the order is deliberate: try the
 * cheap recovery first, then the one that discards the whole client state.
 *
 * ## There is deliberately no `Alert` here
 *
 * `EmptyState`'s docblock is right that a failure needs an alert and a retry, and
 * that rule is about a failure INSIDE a page that still has other content. This
 * page is nothing but the failure, so the heading already carries what an
 * `AlertTitle` would, and stacking the two says it twice.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    /*
     * Logged because the buttons below destroy the evidence: `reset()` re-renders
     * and a reload wipes the console entry that React itself printed. The digest
     * is the only handle a reader can quote in a bug report, and it is absent in
     * development, where the message is the real one instead.
     */
    console.error('[velobits-ui docs] render failed', error);
  }, [error]);

  /*
   * In a production build Next replaces a server-side message with a digest. On a
   * static export most errors here are genuinely client-side, so the message is
   * usually real , but never assume it is present, and show whichever exists.
   */
  const detail = [error.digest && `digest: ${error.digest}`, error.message]
    .filter(Boolean)
    .join('\n');

  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-6 py-24 text-center">
      <p className="font-mono text-sm text-danger">Error</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-2 leading-7 text-muted-foreground">
        This page failed to render in your browser. Nothing is saved on this site, so retrying is
        safe and loses nothing.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button variant="primary" onClick={reset}>
          <RotateCcwIcon />
          Try again
        </Button>
        <Button variant="secondary" onClick={() => window.location.reload()}>
          Reload the page
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/docs">
            Documentation
            <ArrowRightIcon className="rtl:rotate-180" />
          </Link>
        </Button>
      </div>

      {detail && (
        <div className="mt-8 text-start">
          <p className="mb-1.5 text-xs font-medium text-muted-foreground">
            Copy this into an issue if it keeps happening
          </p>
          {/*
           * `terminal` and `copyable`: this is the one string on the page that has
           * to be transcribed exactly, which is the case that variant exists for.
           */}
          <CodeBlock variant="terminal" wrap copyable label="error detail">
            {detail}
          </CodeBlock>
        </div>
      )}
    </main>
  );
}
