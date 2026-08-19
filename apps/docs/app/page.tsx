import Link from 'next/link';

import {
  Badge,
  Button,
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CodeBlock,
} from '@velobitsio/ui';
import { ArrowRightIcon, DropletIcon, LayersIcon, SparklesIcon } from '@velobitsio/icons';

import { COMPONENT_GROUPS, componentHref } from '@/lib/docs-nav';
import { registryItemsByName } from '@/lib/generated/registry-data';
import { namespacedItem } from '@/lib/site';

/**
 * The landing page.
 *
 * Counts are computed from the registry, never typed. This site said "37
 * components" in four places for as long as there were 37, and then `motion` was
 * added and every one of them was wrong at once.
 *
 * Blur budget: the SiteHeader's sticky `.glass` is the only live backdrop layer
 * here. The cards below are Tier S, which carries no `backdrop-filter` by
 * default , which is exactly the property that makes a grid of them affordable.
 */
export default function HomePage() {
  const tiers = COMPONENT_GROUPS.filter((group) =>
    ['Primitives', 'Overlays', 'Composites'].includes(group.title),
  );
  const componentCount = tiers.reduce((total, group) => total + group.names.length, 0);

  // A handful worth showing on a landing page: one recognisable primitive, the
  // composites that are hard to find elsewhere, and the newest addition.
  const featured = [
    'button',
    'data-table',
    'app-shell',
    'command-palette',
    'glass-surface',
    'motion',
  ];

  return (
    <main id="main" className="mx-auto w-full max-w-screen-xl px-4 sm:px-6">
      {/* ── Hero ──────────────────────────────────────────────────────────── */}
      <section className="flex flex-col items-start gap-6 py-20 md:py-28">
        <Badge variant="brand">v0.1 · {componentCount} components</Badge>
        <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-balance md:text-6xl">
          One token and component layer for every VeloBits surface.
        </h1>
        <p className="max-w-2xl text-lg leading-8 text-muted-foreground text-pretty">
          Accessible, contrast-gated React components on a warm neutral palette and a two-tier glass
          material. Install them with the CLI and own the source, or take the npm package: same
          components either way, authored once.
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="primary" size="lg" asChild>
            <Link href="/docs">
              Get started
              <ArrowRightIcon className="rtl:rotate-180" />
            </Link>
          </Button>
          <Button variant="secondary" size="lg" asChild>
            <Link href="/docs/components">Browse components</Link>
          </Button>
        </div>

        <div className="w-full max-w-2xl pt-2">
          <CodeBlock variant="terminal" wrap copyable label="install command">
            {`npx shadcn@latest add ${namespacedItem('velobits')}`}
          </CodeBlock>
          <p className="mt-2 text-sm text-muted-foreground">
            A{' '}
            <Link href="/docs/registry" className="text-link underline underline-offset-4">
              registered shadcn namespace
            </Link>{' '}
            with nothing to configure. Install anything by name.
          </p>
        </div>
      </section>

      {/* ── The three claims worth making ─────────────────────────────────── */}
      <section className="grid gap-4 border-t border-border py-16 md:grid-cols-3">
        {[
          {
            icon: DropletIcon,
            title: 'Contrast is a gate, not a guideline',
            body: 'Every semantic colour pair is asserted against its WCAG target in both themes, composited in gamma-encoded sRGB, because that is what browsers actually do. A palette edit that breaks contrast fails CI instead of shipping.',
            href: '/docs/colors',
            cta: 'See the measurements',
          },
          {
            icon: LayersIcon,
            title: 'Two glass tiers, and they are not the same material',
            body: 'Tier O floats over arbitrary content and is measured against seven worst-case backdrops. Tier S sits on the page and carries no backdrop-filter by default, so a twenty-card grid does not mount twenty blur layers.',
            href: '/docs/components/glass-surface',
            cta: 'See GlassSurface',
          },
          {
            icon: SparklesIcon,
            title: 'Authored once, shipped twice',
            body: 'The same source is the npm package and the shadcn registry, and a parity test asserts the two never drift. Which one you want is decided by your architecture, not your taste.',
            href: '/docs/installation',
            cta: 'Which one you want',
          },
        ].map((claim) => (
          <Card key={claim.title}>
            <CardHeader>
              <claim.icon className="mb-2 text-link" size={24} />
              <CardTitle className="text-base">{claim.title}</CardTitle>
              <CardDescription className="leading-6">{claim.body}</CardDescription>
            </CardHeader>
            <div className="px-6 pb-6">
              <Link href={claim.href} className="text-sm text-link underline underline-offset-4">
                {claim.cta}
              </Link>
            </div>
          </Card>
        ))}
      </section>

      {/* ── A sample of the set ───────────────────────────────────────────── */}
      <section className="space-y-6 border-t border-border py-16">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Start somewhere</h2>
            <p className="mt-1 text-muted-foreground">
              {tiers.map((tier) => `${tier.names.length} ${tier.title.toLowerCase()}`).join(' · ')}.
            </p>
          </div>
          <Button variant="ghost" asChild>
            <Link href="/docs/components">
              All {componentCount}
              <ArrowRightIcon className="rtl:rotate-180" />
            </Link>
          </Button>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map((name) => {
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
                      {item.description.split(/(?<=\.)\s/)[0]}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      <footer className="border-t border-border py-10 text-sm text-muted-foreground">
        Built by VeloBits. The registry and these docs deploy as one artefact; see{' '}
        <Link href="/docs/registry" className="text-link underline underline-offset-4">
          Registry
        </Link>
        .
      </footer>
    </main>
  );
}
