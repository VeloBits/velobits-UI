'use client';

import Link from 'next/link';

import {
  Alert,
  AlertDescription,
  AlertTitle,
  Badge,
  CodeBlock,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@velobitsio/ui';
import { LayersIcon } from '@velobitsio/icons';

import type { DocRegistryItem } from '@/lib/generated/registry-data';
import { componentHref } from '@/lib/docs-nav';
import { itemUrl, namespacedItem, REGISTRY_NAMESPACE } from '@/lib/site';

import { CodePanel } from './code-panel';
import { CommandSnippet, InstallSnippet } from './command-snippet';

/**
 * The two ways to install one item, as the shadcn docs arrange them: a CLI tab
 * that is one command, and a Manual tab that is the dependencies plus the file.
 *
 * The dependency lists, the file paths and the file contents all come from
 * `registry/registry.ts` by way of the codegen, the same source the CLI reads.
 * So the Manual instructions cannot describe a different install from the one the
 * CLI performs, which is the failure mode of every hand-written "or copy this
 * file" section.
 */
export function InstallSection({ item }: { item: DocRegistryItem }) {
  return (
    <section className="space-y-4">
      <h2 id="installation" className="scroll-mt-24 text-xl font-semibold tracking-tight">
        Installation
      </h2>

      <Tabs defaultValue="cli">
        <TabsList>
          <TabsTrigger value="cli">CLI</TabsTrigger>
          <TabsTrigger value="manual">Manual</TabsTrigger>
        </TabsList>

        <TabsContent value="cli" className="pt-2">
          <CommandSnippet
            command={`shadcn@latest add ${namespacedItem(item.name)}`}
            label={`install ${item.name}`}
          />
          {/*
           * No setup step. `@velobits` is registered in shadcn's public index, so
           * the command above works in any project that has run `shadcn init`.
           * This block used to open with "One-time setup" and a components.json
           * snippet; keeping that would now be telling every reader to do
           * something they do not need to do.
           */}
          <Alert>
            <LayersIcon />
            <AlertTitle>Nothing to configure</AlertTitle>
            <AlertDescription>
              <p>
                <code>{REGISTRY_NAMESPACE}</code> is a registered shadcn namespace, so it resolves
                out of the box, with no <code>components.json</code> entry needed.
              </p>
              <p className="mt-3">
                Two cases still want an explicit form: a CLI too old to know the index, or pinning
                the origin (a staging mirror, an air-gapped copy). Either way the full URL is
                addressable directly:
              </p>
              <CodeBlock variant="terminal" wrap copyable label="install by URL" className="mt-2">
                {`npx shadcn@latest add ${itemUrl(item.name)}`}
              </CodeBlock>
              <p className="mt-3">
                The{' '}
                <Link href="/docs/registry" className="text-link underline underline-offset-4">
                  Registry
                </Link>{' '}
                page covers pinning, <code>view</code> and <code>search</code>.
              </p>
            </AlertDescription>
          </Alert>
        </TabsContent>

        <TabsContent value="manual" className="space-y-6 pt-2">
          {item.dependencies.length > 0 && (
            <div>
              <p className="text-sm font-medium">Install the following dependencies:</p>
              <InstallSnippet packages={item.dependencies} label="dependencies" />
            </div>
          )}

          {item.devDependencies.length > 0 && (
            <div>
              <p className="text-sm font-medium">And these dev dependencies:</p>
              <InstallSnippet packages={item.devDependencies} dev label="dev dependencies" />
            </div>
          )}

          {item.registryDependencies.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">
                Add these registry items first; this one imports them:
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

          {item.files.length > 0 ? (
            item.files.map((file) => (
              <div key={file.path} className="space-y-2">
                <p className="text-sm font-medium">
                  Copy and paste the following into <code>{file.target}</code>:
                </p>
                <CodePanel
                  variants={file.variants}
                  label={file.target}
                  maxHeight="34rem"
                  /*
                   * The file's own path names this block's language selection ,
                   * a key a caller lifting that state can recognise, rather than
                   * the `useId()` value the switcher falls back to. It is a state
                   * key and not a DOM id; `file.path` is already unique per item.
                   */
                  blockId={`install:${file.path}`}
                />
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">
              This item ships no files of its own; it is a bundle of the items listed above, so
              installing it by hand means installing each of those.
            </p>
          )}
        </TabsContent>
      </Tabs>
    </section>
  );
}
