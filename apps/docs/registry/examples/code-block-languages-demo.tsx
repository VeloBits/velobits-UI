'use client';

import { useState } from 'react';

import { Badge, CodeBlock, registerCodeLanguages } from '@velobitsio/ui';

/**
 * Registering a language the library does not ship.
 *
 * At module scope on purpose: the registry is static for the life of the app, so
 * this belongs next to the import rather than inside an effect that would re-run
 * it. `accent` is any CSS colour, which is what lets a language arrive with the
 * colour readers already know it by , Rust's rust, here, rather than the
 * system's `--primary`.
 *
 * Registering `rust` does not make any block offer Rust. A block offers a
 * language when it was given code for that language and not otherwise, which is
 * why the second block below has to supply it.
 */
registerCodeLanguages([
  {
    id: 'rust',
    label: 'Rust',
    shortLabel: 'RS',
    grammar: 'rust',
    extension: '.rs',
    accent: '#DEA584',
  },
]);

const TS = `type Flag = { key: string; on: boolean };

export function isOn(flags: Flag[], key: string): boolean {
  return flags.some((flag) => flag.key === key && flag.on);
}`;

const JS = `export function isOn(flags, key) {
  return flags.some((flag) => flag.key === key && flag.on);
}`;

const RUST = `pub fn is_on(flags: &[Flag], key: &str) -> bool {
    flags.iter().any(|f| f.key == key && f.on)
}`;

export default function CodeBlockLanguagesDemo() {
  /*
   * The whole point of `blockId`: one page, two blocks, one handler, and the
   * handler can still tell them apart. Nothing here is a store , it is a
   * `useState` , but the shape it receives is the shape a reducer would, so
   * lifting this into Zustand or Redux later is a change of destination and not
   * a change of call site.
   */
  const [last, setLast] = useState<{ language: string; blockId: string } | null>(null);

  return (
    <div className="w-full space-y-4">
      <CodeBlock
        copyable
        label="isOn helper"
        blockId="is-on"
        variants={{ ts: TS, js: JS }}
        onLanguageChange={(language, meta) => setLast({ language, blockId: meta.blockId })}
      />

      <CodeBlock
        copyable
        label="is_on helper"
        blockId="is-on-ffi"
        variants={[
          { language: 'rust', code: RUST },
          { language: 'ts', code: TS },
        ]}
        onLanguageChange={(language, meta) => setLast({ language, blockId: meta.blockId })}
      />

      <p className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
        {last ? (
          <>
            <span>Last switch reported:</span>
            <Badge variant="primary">{last.language}</Badge>
            <span>from</span>
            <Badge variant="neutral">{last.blockId}</Badge>
          </>
        ) : (
          <span>Switch either block&rsquo;s language , the report appears here.</span>
        )}
      </p>
    </div>
  );
}
