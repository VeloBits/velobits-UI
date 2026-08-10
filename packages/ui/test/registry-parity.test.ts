import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { buildableItems, registry } from '../../../registry/registry';

/**
 * The dual distribution has three lists that must agree, maintained in three
 * files:
 *
 *   1. `registry/registry.ts`      — what the shadcn CLI serves
 *   2. `packages/ui/tsup.config.ts` — what gets built for npm
 *   3. `packages/ui/package.json`   — what npm consumers can import
 *
 * Any one of them can be updated alone, and the failure is quiet: a component
 * that builds but is not importable, or is importable but 404s from the CLI.
 * This test is the thing that makes adding a component a single coherent change.
 */

/*
 * `process.cwd()` rather than `import.meta.url`: vitest rewrites import.meta in
 * transformed modules, and the URL-relative form resolved to the package's
 * `main` field instead of this directory.
 */
const uiDir = process.cwd();
const tsupSource = readFileSync(join(uiDir, 'tsup.config.ts'), 'utf8');
const pkg = JSON.parse(readFileSync(join(uiDir, 'package.json'), 'utf8')) as {
  exports: Record<string, unknown>;
  peerDependencies: Record<string, string>;
  dependencies: Record<string, string>;
};

/** Entry keys declared in the tsup entry map. */
const tsupEntries = [...tsupSource.matchAll(/^\s{2}(?:'([a-z-]+)'|([a-z-]+)):\s*`/gm)].map(
  (m) => m[1] ?? m[2]!,
);

const exportSubpaths = Object.keys(pkg.exports)
  .filter((k) => k !== '.' && k !== './package.json')
  .map((k) => k.replace('./', ''));

const barrel = readFileSync(join(uiDir, '../../registry/velobits/index.ts'), 'utf8');

/** `registry/velobits/ui/form.tsx` → `ui/form`, which is how the barrel spells it. */
function sourcePath(item: { files?: { path: string }[] }): string {
  return item.files![0]!.path.replace('registry/velobits/', '').replace(/\.tsx?$/, '');
}

/**
 * Components deliberately NOT re-exported from `registry/velobits/index.ts`,
 * reachable only as a subpath. Each one costs a consumer an extra import line,
 * so the bar for adding to this set is an optional peer dependency that would
 * otherwise become mandatory for everyone. See the suite below.
 */
/**
 * Subpath-only components. Two entries, two different reasons — both deliberate.
 *
 *   form    `react-hook-form` is an OPTIONAL peer, and the barrel is one bundled
 *           module, so a re-export would put a top-level `import 'react-hook-form'`
 *           in `dist/index.js` and break every app that never installed it.
 *
 *   motion  A budget decision, not a dependency one. The barrel's own-code
 *           `size-limit` sits at ~28 kB of 32, and anything in the barrel is paid
 *           for by every consumer whether they import it or not — including
 *           Framer's runtime, for an app that only wanted a Button.
 */
const BARREL_EXCLUDED = new Set(['form', 'motion']);

describe('registry ↔ tsup ↔ exports parity', () => {
  it('every buildable registry item has a tsup entry', () => {
    const missing = buildableItems.map((i) => i.name).filter((n) => !tsupEntries.includes(n));
    expect(
      missing,
      `In registry/registry.ts but not built by packages/ui/tsup.config.ts: ${missing.join(', ')}`,
    ).toEqual([]);
  });

  it('every tsup entry is a registry item', () => {
    const names = new Set(buildableItems.map((i) => i.name));
    const extra = tsupEntries.filter((e) => e !== 'index' && !names.has(e));
    expect(
      extra,
      `Built by tsup but absent from registry/registry.ts, so the CLI cannot install it: ${extra.join(', ')}`,
    ).toEqual([]);
  });

  it('every tsup entry is importable as a subpath', () => {
    const missing = tsupEntries.filter((e) => e !== 'index' && !exportSubpaths.includes(e));
    expect(
      missing,
      `Built but not listed in package.json "exports", so it is unreachable: ${missing.join(', ')}`,
    ).toEqual([]);
  });

  it('every exported subpath is actually built', () => {
    const missing = exportSubpaths.filter((s) => !tsupEntries.includes(s));
    expect(
      missing,
      `Declared in "exports" but never built — a consumer gets a resolution error: ${missing.join(', ')}`,
    ).toEqual([]);
  });

  it('re-exports every entry from the barrel', () => {
    /**
     * The fourth list, and the one that bit first: `Textarea` was a registry
     * item, a tsup entry AND an exports subpath, but absent from
     * `registry/velobits/index.ts`. Subpath imports worked; the barrel import
     * did not. Caught by the docs build rather than by a test, which is exactly
     * the gap this closes.
     */
    const missing = buildableItems
      .filter((item) => !BARREL_EXCLUDED.has(item.name))
      .filter((item) => !barrel.includes(`'./${sourcePath(item)}'`))
      .map((i) => i.name);
    expect(
      missing,
      `Built and exported as a subpath, but missing from the barrel — so ` +
        `\`import { X } from '@velobits-dev/ui'\` fails while ` +
        `\`from '@velobits-dev/ui/x'\` works: ${missing.join(', ')}`,
    ).toEqual([]);
  });

  describe('the barrel exclusions are a decision, not an oversight', () => {
    /**
     * Two components are NOT re-exported from the barrel — see
     * {@link BARREL_EXCLUDED} for which and why. `Form` is a dependency
     * constraint: `react-hook-form` is an OPTIONAL peer and the barrel is one
     * bundled module, so a re-export would put a top-level
     * `import 'react-hook-form'` at the top of `dist/index.js` and every app
     * importing a Button from the barrel would fail to resolve a package it never
     * installed. The marketing site is exactly that app. `Motion` is a budget
     * constraint, and it drags Framer's runtime with it.
     *
     * Asserted in both directions, because each half fails silently on its own.
     * Adding the export back would break consumers' builds or blow the size gate;
     * letting the subpath lapse would make the component unreachable entirely.
     */
    for (const name of BARREL_EXCLUDED) {
      const item = buildableItems.find((i) => i.name === name)!;

      it(`${name} is genuinely absent from the barrel`, () => {
        expect(item, `${name} is in the exclusion list but not in the registry`).toBeDefined();
        expect(
          barrel.includes(`'./${sourcePath(item)}'`),
          `${name} was re-exported from the barrel. If that is intended, the optional peer ` +
            `dependency has to become a required one first — see the docblock in ` +
            `registry/velobits/ui/${name}.tsx.`,
        ).toBe(false);
      });

      it(`${name} is still reachable as its own subpath`, () => {
        expect(
          exportSubpaths,
          `${name} is excluded from the barrel, so the subpath export is the ONLY way in.`,
        ).toContain(name);
        expect(tsupEntries).toContain(name);
      });
    }

    it('declares the optional peer as optional, and never bundles it', () => {
      const raw = JSON.parse(readFileSync(join(uiDir, 'package.json'), 'utf8')) as {
        peerDependenciesMeta?: Record<string, { optional?: boolean }>;
      };
      expect(pkg.peerDependencies['react-hook-form']).toBeDefined();
      expect(pkg.dependencies['react-hook-form']).toBeUndefined();
      expect(raw.peerDependenciesMeta?.['react-hook-form']?.optional).toBe(true);
      /**
       * Bundling it would be the quieter failure of the two: our copy would have
       * its own module state, so `useFormContext()` inside `FormField` would read
       * a different context from the consumer's `useForm()` and every field would
       * register against nothing.
       */
      expect(tsupSource).toMatch(/external:[\s\S]*'react-hook-form'/);
    });
  });

  it('found a non-trivial number of entries, so the regex above still works', () => {
    // Guards against the parse silently returning [] and every assertion passing.
    expect(tsupEntries.length).toBeGreaterThan(20);
    expect(tsupEntries).toContain('button');
    expect(tsupEntries).toContain('index');
  });
});

describe('registry hygiene', () => {
  it('has no duplicate item names', () => {
    const names = registry.items.map((i) => i.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('resolves every registryDependency within the registry', () => {
    const names = new Set(registry.items.map((i) => i.name));
    const dangling = registry.items.flatMap((i) =>
      (i.registryDependencies ?? [])
        .filter((d) => !d.startsWith('http') && !names.has(d))
        .map((d) => `${i.name} → ${d}`),
    );
    expect(dangling, `dangling registryDependencies: ${dangling.join(', ')}`).toEqual([]);
  });

  it('gives the `velobits` style every component, so one command installs the set', () => {
    const style = registry.items.find((i) => i.name === 'velobits')!;
    const uiNames = registry.items.filter((i) => i.type === 'registry:ui').map((i) => i.name);
    const missing = uiNames.filter((n) => !style.registryDependencies?.includes(n));
    expect(missing, `not reachable from the base style: ${missing.join(', ')}`).toEqual([]);
  });

  it('ships the theme item with both light and dark variable sets', () => {
    const theme = registry.items.find((i) => i.name === 'velobits-theme')!;
    expect(Object.keys(theme.cssVars?.light ?? {}).length).toBeGreaterThan(20);
    expect(Object.keys(theme.cssVars?.dark ?? {}).length).toBeGreaterThan(20);
    // Derived from @velobits-dev/tokens, so the two sets necessarily match in shape.
    expect(Object.keys(theme.cssVars!.light!).sort()).toEqual(
      Object.keys(theme.cssVars!.dark!).sort(),
    );
  });

  it('declares @velobits-dev/icons wherever a component imports an icon', () => {
    /**
     * A CLI consumer copies the file and installs the listed dependencies. Miss
     * this and their build fails on an unresolved import — on their machine, not
     * in our CI.
     */
    const checkbox = registry.items.find((i) => i.name === 'checkbox')!;
    expect(checkbox.dependencies).toContain('@velobits-dev/icons');
  });
});

describe('packaging invariants that break consumers quietly', () => {
  it('keeps React and the sibling packages as peers, never dependencies', () => {
    /**
     * A bundled React means two copies at runtime and hooks that throw. Bundling
     * @velobits-dev/ui's siblings would also defeat the Module Federation singleton
     * arrangement the editor app needs.
     */
    for (const p of [
      'react',
      'react-dom',
      '@velobits-dev/tokens',
      '@velobits-dev/icons',
      'framer-motion',
    ]) {
      expect(pkg.peerDependencies).toHaveProperty(p);
      expect(pkg.dependencies).not.toHaveProperty(p);
    }
  });

  it('marks the package side-effect free so tree-shaking is permitted', () => {
    const raw = JSON.parse(readFileSync(join(uiDir, 'package.json'), 'utf8')) as {
      sideEffects: boolean;
    };
    expect(raw.sideEffects).toBe(false);
  });
});
