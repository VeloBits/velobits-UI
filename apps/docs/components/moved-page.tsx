import type { Metadata } from 'next';
import Link from 'next/link';

import { Button } from '@velobits-dev/ui';
import { ArrowRightIcon } from '@velobits-dev/icons';

/**
 * A page that used to live somewhere else.
 *
 * `redirects()` in `next.config.mjs` is one of the features Next lists as
 * unsupported under `output: 'export'` — there is no server left to issue a 301.
 * So the redirect is a `<meta http-equiv="refresh">`, which every browser honours
 * and every static host serves without configuration.
 *
 * The visible link is not a fallback nicety: a meta refresh is invisible to a
 * screen reader until it fires, and a reader who lands here with JavaScript
 * disabled or a slow connection needs something to activate. `content="0"`
 * refreshes immediately, so in practice nobody reads it — which is the point of
 * keeping it to one sentence.
 *
 * These exist because three URLs were published before the docs were
 * restructured. They cost four lines each and they are the difference between a
 * bookmark working and a 404.
 */
export function movedMetadata(to: string, title: string): Metadata {
  return {
    title,
    // `robots: noindex` so the stub does not compete with the real page in
    // search results. The canonical points at the destination for the same
    // reason.
    robots: { index: false, follow: true },
    alternates: { canonical: to },
    other: { refresh: `0; url=${to}` },
  };
}

export function MovedPage({ to, title }: { to: string; title: string }) {
  return (
    <main id="main" className="mx-auto w-full max-w-2xl px-6 py-24 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">{title} has moved</h1>
      <p className="mt-2 text-muted-foreground">
        This page now lives at <code>{to}</code>.
      </p>
      <Button variant="primary" asChild className="mt-6">
        <Link href={to}>
          Continue
          <ArrowRightIcon className="rtl:rotate-180" />
        </Link>
      </Button>
    </main>
  );
}
