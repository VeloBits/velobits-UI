'use client';

import { useState } from 'react';

import { CodeBlock, Tabs, TabsContent, TabsList, TabsTrigger } from '@velobits-dev/ui';

/**
 * A shell command in the four package managers, the way shadcn's own docs show
 * them.
 *
 * Uses the system's `CodeBlock` in its `terminal` variant rather than Shiki: a
 * one-line command has nothing worth colouring, and `--code` / `--on-code` are
 * deliberately theme-invariant, which is exactly right for something the reader
 * is about to transcribe into a terminal.
 */
const RUNNERS = [
  { id: 'npm', exec: 'npx' },
  { id: 'pnpm', exec: 'pnpm dlx' },
  { id: 'yarn', exec: 'yarn dlx' },
  { id: 'bun', exec: 'bunx --bun' },
] as const;

export function CommandSnippet({
  /** The command after the runner, e.g. `shadcn@latest add @velobits/button`. */
  command,
  label,
}: {
  command: string;
  label?: string;
}) {
  const [runner, setRunner] = useState<string>(RUNNERS[0].id);

  return (
    <Tabs value={runner} onValueChange={setRunner} className="my-4">
      <TabsList variant="line">
        {RUNNERS.map((entry) => (
          <TabsTrigger key={entry.id} value={entry.id}>
            {entry.id}
          </TabsTrigger>
        ))}
      </TabsList>
      {RUNNERS.map((entry) => (
        <TabsContent key={entry.id} value={entry.id} className="pt-2">
          <CodeBlock variant="terminal" wrap copyable label={label ?? 'command'}>
            {`${entry.exec} ${command}`}
          </CodeBlock>
        </TabsContent>
      ))}
    </Tabs>
  );
}

/**
 * The same, for a dependency install rather than a `dlx` one-off — `npm i` and
 * `pnpm add` are different verbs, so this cannot be the runner list above with a
 * different string.
 */
const INSTALLERS = [
  { id: 'npm', exec: 'npm install' },
  { id: 'pnpm', exec: 'pnpm add' },
  { id: 'yarn', exec: 'yarn add' },
  { id: 'bun', exec: 'bun add' },
] as const;

export function InstallSnippet({
  packages,
  dev = false,
  label,
}: {
  packages: string[];
  dev?: boolean;
  label?: string;
}) {
  const [runner, setRunner] = useState<string>(INSTALLERS[0].id);
  if (!packages.length) return null;

  return (
    <Tabs value={runner} onValueChange={setRunner} className="my-4">
      <TabsList variant="line">
        {INSTALLERS.map((entry) => (
          <TabsTrigger key={entry.id} value={entry.id}>
            {entry.id}
          </TabsTrigger>
        ))}
      </TabsList>
      {INSTALLERS.map((entry) => (
        <TabsContent key={entry.id} value={entry.id} className="pt-2">
          <CodeBlock variant="terminal" wrap copyable label={label ?? 'install command'}>
            {`${entry.exec} ${dev ? (entry.id === 'npm' ? '--save-dev ' : '-D ') : ''}${packages.join(' ')}`}
          </CodeBlock>
        </TabsContent>
      ))}
    </Tabs>
  );
}
