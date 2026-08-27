import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';

import { Badge } from '@velobitsio/ui';
import { ChevronRightIcon } from '@velobitsio/icons';

import { CodePanel } from '@/components/code-panel';
import { ComponentPreview } from '@/components/component-preview';
import { DocsPager } from '@/components/docs-pager';
import { DocsToc, type TocEntry } from '@/components/docs-toc';
import { InlineMarkup } from '@/components/inline-markup';
import { InstallSection } from '@/components/install-section';
import { PropsTable } from '@/components/props-table';
import { Requirements } from '@/components/requirements';
import { componentContent } from '@/lib/generated/content';
import { componentProps } from '@/lib/generated/props';
import { registryItems, registryItemsByName } from '@/lib/generated/registry-data';

/**
 * One route for every registry item.
 *
 * `generateStaticParams` reads the registry, so **an item added to
 * `registry/registry.ts` gets a documentation page with no further edit** , the
 * same anti-drift rule `/docs/colors` and `/docs/icons` follow by enumerating
 * their packages rather than listing entries by hand. The page a new component
 * gets is complete on its own: title, description, install commands,
 * requirements and prop table all come from the registry and the TypeScript
 * sources. `apps/docs/content/components.ts` only adds what cannot be derived ,
 * a usage snippet, which examples to show, and prose.
 *
 * This is why there are not 46 MDX files. Forty-six pages that must each be
 * edited to stay correct is forty-six places to forget; one page that derives
 * itself is none.
 */

export function generateStaticParams() {
  return registryItems.map((item) => ({ slug: item.name }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const item = registryItemsByName[slug];
  if (!item) return {};

  return {
    title: item.title,
    // The registry descriptions are paragraphs of rationale; a meta description
    // wants the first sentence, not the essay.
    description: item.description.split(/(?<=\.)\s/)[0] ?? item.description,
  };
}

export default async function ComponentPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const item = registryItemsByName[slug];
  if (!item) notFound();

  const content = componentContent[slug];
  const propGroups = componentProps[slug];
  const examples = content?.examples ?? [];
  const [hero, ...rest] = examples;

  const toc: TocEntry[] = [
    { id: 'installation', title: 'Installation', level: 2 },
    { id: 'requirements', title: 'Requirements', level: 2 },
    ...(content?.usage ? [{ id: 'usage', title: 'Usage', level: 2 as const }] : []),
    ...(rest.length ? [{ id: 'examples', title: 'Examples', level: 2 as const }] : []),
    ...rest.map((example, index): TocEntry => ({
      id: `example-${index}`,
      title: example.title ?? example.name,
      level: 3,
    })),
    ...(propGroups?.length
      ? [{ id: 'api-reference', title: 'API reference', level: 2 as const }]
      : []),
  ];

  return (
    <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_14rem] xl:gap-10">
      <main id="main" className="min-w-0 space-y-12 py-8 pb-24">
        {/* ── Header ────────────────────────────────────────────────────── */}
        <header className="space-y-3">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1 text-sm text-muted-foreground">
              <li>
                <Link href="/docs" className="hover:text-fg">
                  Docs
                </Link>
              </li>
              <ChevronRightIcon className="size-3.5 rtl:rotate-180" aria-hidden />
              <li>
                <Link href="/docs/components" className="hover:text-fg">
                  Components
                </Link>
              </li>
              <ChevronRightIcon className="size-3.5 rtl:rotate-180" aria-hidden />
              {/* A plain span with aria-current, never a role="link" aria-disabled:
                  that spelling announces static text as a broken link, which is
                  the exact thing `Breadcrumb` in this registry exists to fix. */}
              <li aria-current="page" className="font-medium text-fg">
                {item.title}
              </li>
            </ol>
          </nav>

          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">{item.title}</h1>
            <Badge variant="outline">{item.type.replace('registry:', '')}</Badge>
          </div>

          {item.description && (
            <p className="max-w-3xl leading-7 text-muted-foreground">{item.description}</p>
          )}

          {content?.notes?.map((note, index) => (
            <p key={index} className="max-w-3xl leading-7 text-muted-foreground">
              <InlineMarkup text={note} />
            </p>
          ))}
        </header>

        {/* ── The hero preview ──────────────────────────────────────────── */}
        {hero && <ComponentPreview name={hero.name} />}

        <InstallSection item={item} />

        <Requirements item={item} />

        {/* ── Usage ─────────────────────────────────────────────────────── */}
        {content?.usage && (
          <section className="space-y-3">
            <h2 id="usage" className="scroll-mt-24 text-xl font-semibold tracking-tight">
              Usage
            </h2>
            <p className="text-sm text-muted-foreground">
              Spelled for the npm package. If you installed through the CLI the component is in your
              own tree instead, so the import is <code>@/components/ui/velobits/{slug}</code> with
              the default aliases; see{' '}
              <Link href="/docs/installation" className="text-link underline underline-offset-4">
                Installation
              </Link>{' '}
              for why it is one flat folder.
            </p>
            {/*
             * `variants` is ordered and its first entry is the default language,
             * so a TSX snippet opens on TypeScript and the CSS one on
             * `/docs/velobits-theme` opens on CSS , and, having no second
             * language, renders without a selector and without a client component
             * at all. `blockId` names this block's selection for anyone who later
             * lifts it; it is a state key, not a DOM id.
             */}
            <CodePanel
              variants={content.usage.variants}
              label={`${item.title} usage`}
              blockId={`usage:${slug}`}
            />
          </section>
        )}

        {/* ── Examples ──────────────────────────────────────────────────── */}
        {rest.length > 0 && (
          <section className="space-y-6">
            <h2 id="examples" className="scroll-mt-24 text-xl font-semibold tracking-tight">
              Examples
            </h2>
            {rest.map((example, index) => (
              <div key={example.name} className="space-y-2">
                <h3 id={`example-${index}`} className="scroll-mt-24 text-base font-semibold">
                  {example.title ?? example.name}
                </h3>
                {example.description && (
                  <p className="max-w-3xl text-sm text-muted-foreground">
                    <InlineMarkup text={example.description} />
                  </p>
                )}
                <ComponentPreview name={example.name} center={false} />
              </div>
            ))}
          </section>
        )}

        {/* ── API reference ─────────────────────────────────────────────── */}
        {propGroups?.length ? (
          <section className="space-y-4">
            <h2 id="api-reference" className="scroll-mt-24 text-xl font-semibold tracking-tight">
              API reference
            </h2>
            <p className="max-w-3xl text-sm text-muted-foreground">
              Extracted from the TypeScript sources at build time, so it cannot disagree with the
              code. Props inherited from the underlying DOM element or Radix primitive are forwarded
              but not listed: 240 DOM handlers would bury the handful that are actually this
              component&apos;s.
            </p>
            <PropsTable groups={propGroups} />
          </section>
        ) : null}

        <DocsPager name={slug} />
      </main>

      <aside className="hidden xl:sticky xl:top-14 xl:block xl:h-[calc(100dvh-3.5rem)] xl:overflow-y-auto xl:py-8">
        <DocsToc entries={toc} />
      </aside>
    </div>
  );
}
