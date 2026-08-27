import Link from 'next/link';

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CodeBlock,
} from '@velobitsio/ui';
import { AlertTriangleIcon } from '@velobitsio/icons';

import type { DocRegistryItem } from '@/lib/generated/registry-data';
import { componentHref } from '@/lib/docs-nav';
import { NPM_PACKAGES } from '@/lib/site';

/**
 * What this component needs in order to work , every line of it read out of
 * `registry/registry.ts`, so it is the same list the CLI installs.
 *
 * It exists because "it renders unstyled and there is no error anywhere" is the
 * single most common way this design system fails for a new consumer, and every
 * cause is on this card: the token layer missing, the `@source` line missing, or
 * a peer that was never installed.
 */

/** Peers the npm package declares, with why each one is not optional. */
const PEER_NOTES: Record<string, string> = {
  'framer-motion':
    'A REQUIRED peer, not an optional one; VelobitsProvider imports MotionConfig, so a barrel import fails to resolve without it.',
  'react-hook-form':
    'The one OPTIONAL peer. Needed only by Form, which is why Form ships on its own subpath and never in the barrel.',
  '@velobitsio/icons': 'The icon set this component renders glyphs from.',
  '@velobitsio/tokens': 'The token layer. Every colour and radius below resolves through it.',
};

export function Requirements({ item }: { item: DocRegistryItem }) {
  const peers = item.dependencies.filter((dep) => dep in PEER_NOTES);
  const plain = item.dependencies.filter((dep) => !(dep in PEER_NOTES));

  return (
    <section className="space-y-4">
      <h2 id="requirements" className="scroll-mt-24 text-xl font-semibold tracking-tight">
        Requirements
      </h2>

      {/*
       * `[&>*]:min-w-0` is load-bearing, not tidiness. A grid item's `min-width`
       * defaults to `auto`, which floors it at the intrinsic width of its
       * content , so the `<pre>` below could not shrink and its own
       * `overflow-x-auto` never engaged. The card pushed the PAGE sideways
       * instead, by 32px at a 375px viewport, on every component page.
       */}
      <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">The token layer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2 text-sm text-muted-foreground">
            <p>
              Every component here paints from CSS custom properties that{' '}
              <code>{NPM_PACKAGES.tokens}</code> defines. One import, plus one <code>@source</code>{' '}
              line:
            </p>
            <pre className="overflow-x-auto rounded-md border border-border bg-bg2 p-3 font-mono text-xs">
              {`@import '@velobitsio/tokens/theme.css';\n@source "../node_modules/@velobitsio/ui/dist";`}
            </pre>
            <p>
              The <code>@source</code> line is <strong>not optional</strong>. Tailwind v4 does not
              scan <code>node_modules</code>, so utilities used inside the package are never
              generated and the component arrives completely unstyled, with no warning anywhere.
            </p>
            <p>
              Installing through the CLI copies the source into your own tree, where Tailwind
              already scans it, so only the <code>@import</code> applies. See{' '}
              <Link href="/docs/theming" className="text-link underline underline-offset-4">
                Theming
              </Link>
              .
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Packages</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {peers.length > 0 && (
              <ul className="space-y-2">
                {peers.map((dep) => (
                  <li key={dep}>
                    <code className="font-medium">{dep}</code>
                    <p className="text-muted-foreground">{PEER_NOTES[dep]}</p>
                  </li>
                ))}
              </ul>
            )}

            {plain.length > 0 && (
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  Also installed, and bundled into the npm package rather than declared as peers:
                </p>
                <div className="flex flex-wrap gap-2">
                  {plain.map((dep) => (
                    <Badge key={dep} variant="outline">
                      {dep}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {item.registryDependencies.length > 0 && (
              <div className="space-y-2">
                <p className="text-muted-foreground">
                  Registry items this one imports. The CLI pulls them in for you; a manual install
                  means adding each first.
                </p>
                <div className="flex flex-wrap gap-2">
                  {item.registryDependencies.map((dep) => (
                    <Link key={dep} href={componentHref(dep)}>
                      <Badge variant="primary">{dep}</Badge>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {!peers.length && !plain.length && !item.registryDependencies.length && (
              <p className="text-muted-foreground">
                Nothing beyond React and the token layer. This one is self-contained.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/*
       * Shown on every component page, not tucked into a guide, because the
       * failure it prevents is silent. The CLI prompts on the collision and
       * DEFAULTS TO NO , so the reader who hits it and presses Enter keeps the
       * stock `twMerge(clsx())` and loses our extended class groups, with nothing
       * anywhere to say so.
       */}
      {item.registryDependencies.includes('cn') && (
        <Alert variant="warning">
          <AlertTriangleIcon />
          {/* `<code>`, not backticks: this is JSX, and the body below already
              spells it this way. The literal pair shipped on every page whose
              component depends on `cn`. */}
          <AlertTitle>
            Already using shadcn/ui? Overwrite <code>utils</code>
          </AlertTitle>
          <AlertDescription>
            <p>
              This installs our <code>cn</code> to your <code>utils</code> module, the same place
              shadcn puts its own, so you end up with one <code>cn</code> rather than two. If a file
              is already there the CLI asks, and <strong>defaults to no</strong>. Answer yes, or
              pass the flag:
            </p>
            <CodeBlock variant="terminal" wrap copyable label="overwrite utils" className="mt-3">
              {`npx shadcn@latest add @velobits/${item.name} --overwrite`}
            </CodeBlock>
            <p className="mt-3">
              Ours is a strict <strong>superset</strong> of shadcn&apos;s: same signature, same
              behaviour on every standard utility, plus the groups this system needs ,{' '}
              <code>rounded-pill</code>, the <code>z-*</code> ladder, the named durations, and a
              bidirectional <code>control-material</code> ⇄ <code>shadow</code> conflict. So
              overwriting is safe for your existing shadcn components; keeping theirs is what
              quietly breaks ours.
            </p>
          </AlertDescription>
        </Alert>
      )}
    </section>
  );
}
