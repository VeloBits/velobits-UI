/**
 * Writes `registry.json` from `registry/registry.ts`, then compiles it into
 * `apps/docs/public/r/*.json` with the shadcn CLI.
 *
 * Run: `npm run registry:build`
 *
 * Two things this exists to prevent:
 *  1. Hand-maintaining `registry.json`, where the theme item's ~70 CSS variables
 *     would silently drift from `@velobits-dev/tokens`.
 *  2. Publishing a registry whose file paths do not exist — the CLI fails at the
 *     consumer's machine, not ours, so the check happens here.
 */
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { registry } from '../registry/registry.ts';
import { IMPORT_REWRITES, INSTALL_DIR, UTILS_TARGET, targetFor } from './registry-layout.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const registryPath = join(root, 'registry.json');
const outputDir = join(root, 'apps/docs/public/r');

/* ── 1. Validate every declared file actually exists ───────────────────────── */

const missing: string[] = [];
for (const item of registry.items) {
  for (const file of item.files ?? []) {
    if (!existsSync(join(root, file.path))) missing.push(`${item.name}: ${file.path}`);
  }
}
if (missing.length) {
  console.error('registry.json references files that do not exist:\n  ' + missing.join('\n  '));
  process.exit(1);
}

/* ── 2. Validate registryDependencies resolve within the registry ──────────── */

const names = new Set(registry.items.map((i) => i.name));
const danglingDeps: string[] = [];
for (const item of registry.items) {
  for (const dep of item.registryDependencies ?? []) {
    // A URL or a bare shadcn/ui name is legitimate; anything else must be ours.
    if (dep.startsWith('http') || names.has(dep)) continue;
    danglingDeps.push(`${item.name} → ${dep}`);
  }
}
if (danglingDeps.length) {
  console.error(
    'registryDependencies that resolve to nothing in this registry:\n  ' +
      danglingDeps.join('\n  ') +
      '\n(If one is intentionally a shadcn/ui upstream item, add it to the allowlist in this script.)',
  );
  process.exit(1);
}

/* ── 3. Emit registry.json, with self-references rewritten to absolute URLs ─── */

/**
 * ## A bare `registryDependency` is a shadcn/ui item, NOT one of ours
 *
 * This is the whole reason this step exists, and it is not a subtlety — it is the
 * difference between a registry that installs and one that does not. Per the
 * shadcn docs: *"Bare names keep their existing behavior. `button` means the
 * built-in shadcn `button` item, not an item from the same repository."*
 *
 * So `button` declaring `registryDependencies: ['cn']` does not mean our `cn`. The
 * CLI goes and asks `https://ui.shadcn.com/r/styles/new-york-v4/cn.json`, which
 * does not exist, and the install dies on the consumer's machine with an error
 * naming a URL they have never heard of. That happens on EVERY item here that
 * depends on another — which is nearly all of them — and it happens on both
 * install paths, the namespaced one and the plain URL.
 *
 * The source in `registry/registry.ts` keeps writing bare names, because that is
 * what makes it readable and what the parity test and the validation above both
 * work against. The rewrite happens here, on the way out, so exactly one
 * representation is published and it is the one the CLI can resolve.
 *
 * Absolute URLs rather than the namespaced `@velobits/cn` form on purpose: a
 * namespaced dependency only resolves for a consumer who has already added the
 * namespace to their `components.json`, which would silently break the
 * zero-config `add https://ui.velobits.dev/r/button.json` path we document as the
 * fallback. A URL resolves for everyone, with no configuration and on any CLI
 * version.
 *
 * `REGISTRY_BASE_URL` exists so a build can be pointed at a local server and
 * genuinely verified end to end — otherwise a localhost install would quietly
 * pull its dependencies from production and prove nothing about the build in
 * front of you.
 */
const baseUrl = (process.env.REGISTRY_BASE_URL ?? registry.homepage).replace(/\/$/, '');

function resolveDependency(dep: string): string {
  if (dep.startsWith('http') || dep.startsWith('./')) return dep;
  // Not ours → a genuine shadcn/ui upstream item, which is left bare so the CLI
  // resolves it against shadcn/ui exactly as intended.
  if (!names.has(dep)) return dep;
  return `${baseUrl}/r/${dep}.json`;
}

const json = {
  $schema: 'https://ui.shadcn.com/schema/registry.json',
  ...registry,
  items: registry.items.map((item) => ({
    ...item,
    ...(item.registryDependencies
      ? { registryDependencies: item.registryDependencies.map(resolveDependency) }
      : {}),
    ...(item.files
      ? {
          files: item.files.map((file) => ({
            ...file,
            target: file.target ?? targetFor(file.path),
          })),
        }
      : {}),
  })),
};
writeFileSync(registryPath, JSON.stringify(json, null, 2) + '\n', 'utf8');
console.log(`wrote registry.json (${registry.items.length} items, deps → ${baseUrl}/r/)`);

/* ── 4. Compile to the per-item JSON the CLI fetches ───────────────────────── */

/**
 * The LOCAL `shadcn`, resolved to its JS entry and run under `process.execPath`.
 *
 * Two bugs live in the obvious `execFileSync('npx', ['--yes', 'shadcn@latest', …])`:
 *
 *   1. `npx` on Windows is `npx.cmd`, and Node 22 refuses to launch a `.cmd`
 *      through `execFile` without `shell: true` (CVE-2024-27980). This script now
 *      runs on every `npm run build`, on a Windows dev machine, so that is no
 *      longer a CI-only path that happened to work on Linux.
 *   2. `@latest` re-resolves the CLI from the network on every build and pins
 *      nothing. A shadcn release that changes the compiled output changes what we
 *      publish, with no diff in this repo to explain it.
 *
 * Resolving the installed package's `bin` entry fixes both: no shell, no network,
 * and the version is in `package-lock.json` like every other build input.
 */
const require = createRequire(import.meta.url);
// `bin` and `exports['.']` are the same file in this package (`./dist/index.js`),
// so resolving the entry point IS resolving the CLI. Reading `bin` out of the
// manifest would be the more literal route and does not work: `shadcn` does not
// export `./package.json`, so `require.resolve` refuses to reach it.
const shadcnEntry = require.resolve('shadcn');

mkdirSync(outputDir, { recursive: true });
try {
  execFileSync(process.execPath, [shadcnEntry, 'build', registryPath, '--output', outputDir], {
    cwd: root,
    stdio: 'inherit',
  });
} catch {
  console.error(
    '\n`shadcn build` failed. The registry.json above is still valid and committed; ' +
      'only the compiled output under apps/docs/public/r is missing.',
  );
  process.exit(1);
}

/* ── 5. Rewrite the imports to match where the files actually land ─────────── */

/**
 * Rewriting here rather than in the sources keeps the npm half untouched — tsup
 * needs the directory layout, and `packages/ui`'s per-entry `exports` map is built
 * from it. One source, two shapes, and the difference is applied on the way out.
 * `scripts/registry-layout.ts` carries the reasoning and the rules.
 *
 * The step runs AFTER `shadcn build` because that is what inlines `content`;
 * before it, there is nothing to rewrite.
 */
const registryFiles = readdirSync(outputDir).filter((f) => f.endsWith('.json'));
let rewritten = 0;
const stillRelative: string[] = [];

for (const fileName of registryFiles) {
  const itemPath = join(outputDir, fileName);
  const item = JSON.parse(readFileSync(itemPath, 'utf8')) as {
    name: string;
    files?: { path: string; content?: string }[];
  };
  if (!item.files?.length) continue;

  let touched = false;
  for (const file of item.files) {
    if (!file.content) continue;
    const before = file.content;
    for (const [pattern, replacement] of IMPORT_REWRITES) {
      file.content = file.content.replace(pattern, replacement);
    }
    if (file.content !== before) touched = true;

    /*
     * The invariant that would have caught the original bug. Every surviving `../`
     * specifier points outside the one flat folder the CLI writes, so it cannot
     * resolve on a consumer's machine — and the only place that shows up is their
     * build, not ours.
     */
    for (const match of file.content.matchAll(/from\s+(['"])(\.\.\/[^'"]*)\1/g)) {
      stillRelative.push(`${item.name} → ${file.path} imports ${match[2]}`);
    }
  }

  if (touched) {
    writeFileSync(itemPath, JSON.stringify(item, null, 2) + '\n', 'utf8');
    rewritten += 1;
  }
}

if (stillRelative.length) {
  console.error(
    '\nimports that will not resolve where the CLI installs these files:\n  ' +
      stillRelative.join('\n  ') +
      '\n(Add a rule to `rewrites` in scripts/build-registry.ts.)',
  );
  process.exit(1);
}

console.log(`rewrote imports in ${rewritten} items → flat ${INSTALL_DIR}/, cn → ${UTILS_TARGET}`);

console.log(`\ncompiled → apps/docs/public/r/`);
console.log('Consumers install with:');
console.log('  npx shadcn@latest add @velobits/velobits   # everything');
console.log('  npx shadcn@latest add @velobits/button     # one component');
console.log('(after adding the @velobits namespace to components.json — see /docs/registry)');
