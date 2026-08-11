import type { Metadata } from 'next';
import Link from 'next/link';

import { Badge, Card, CardDescription, CardHeader, CardTitle } from '@velobits-dev/ui';

import { COMPONENT_GROUPS, componentHref } from '@/lib/docs-nav';
import { registryItemsByName } from '@/lib/generated/registry-data';

export const metadata: Metadata = {
  title: 'Components',
  description: 'Every component the VeloBits design system ships, grouped by tier.',
};

/**
 * The index.
 *
 * Counts are computed from the registry rather than typed — the prose on this
 * site said "37 components" for as long as there were 37, and then `motion` was
 * added and it said 37 in four places. A number that is written once and derived
 * everywhere cannot do that.
 */
export default function ComponentsIndexPage() {
  const componentCount = COMPONENT_GROUPS.filter((group) =>
    ['Primitives', 'Overlays', 'Composites'].includes(group.title),
  ).reduce((total, group) => total + group.names.length, 0);

  return (
    <main id="main" className="space-y-12 py-8 pb-24">
      <header className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">Components</h1>
        <p className="max-w-3xl leading-7 text-muted-foreground">
          {componentCount} components across three tiers, on 36 semantic tokens — every one of which
          is either contrast-gated or carries a recorded exemption. Each page carries its install
          command, what it depends on, and a prop table extracted from the source.
        </p>
      </header>

      {COMPONENT_GROUPS.map((group) => (
        <section key={group.title} className="space-y-4">
          <div className="border-b border-border pb-2">
            <h2 className="text-xl font-semibold tracking-tight">
              {group.title}
              <Badge variant="neutral" className="ms-3 align-middle">
                {group.names.length}
              </Badge>
            </h2>
            <p className="mt-1 max-w-3xl text-sm text-muted-foreground">{group.note}</p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {group.names.map((name) => {
              const item = registryItemsByName[name];
              if (!item) return null;

              return (
                <Link
                  key={name}
                  href={componentHref(name)}
                  className="rounded-xl outline-offset-2 focus-visible:outline-2 focus-visible:outline-primary"
                >
                  <Card className="h-full transition-colors duration-micro ease-out hover:border-field-border">
                    <CardHeader>
                      <CardTitle className="text-base">{item.title}</CardTitle>
                      <CardDescription className="line-clamp-3">
                        {/* The first sentence. These descriptions are paragraphs
                            of rationale, which is right on the page and far too
                            much in a grid cell. */}
                        {item.description.split(/(?<=\.)\s/)[0] ?? 'No description yet.'}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </main>
  );
}
