/**
 * Writes `registry.json` from `registry/registry.ts`, then compiles it into
 * `apps/docs/public/r/*.json` with the shadcn CLI.
 *
 * Run: `npm run registry:build`
 *
 * Two things this exists to prevent:
 *  1. Hand-maintaining `registry.json`, where the theme item's ~70 CSS variables
 *     would silently drift from `@velobits/tokens`.
 *  2. Publishing a registry whose file paths do not exist — the CLI fails at the
 *     consumer's machine, not ours, so the check happens here.
 */
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { registry } from '../registry/registry.ts';

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

/* ── 3. Emit registry.json ─────────────────────────────────────────────────── */

const json = {
  $schema: 'https://ui.shadcn.com/schema/registry.json',
  ...registry,
};
writeFileSync(registryPath, JSON.stringify(json, null, 2) + '\n', 'utf8');
console.log(`wrote registry.json (${registry.items.length} items)`);

/* ── 4. Compile to the per-item JSON the CLI fetches ───────────────────────── */

mkdirSync(outputDir, { recursive: true });
try {
  execFileSync('npx', ['--yes', 'shadcn@latest', 'build', registryPath, '--output', outputDir], {
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

console.log(`\ncompiled → apps/docs/public/r/`);
console.log('Consumers install with:');
console.log('  npx shadcn@latest add https://ui.velobits.dev/r/velobits.json   # everything');
console.log('  npx shadcn@latest add https://ui.velobits.dev/r/button.json     # one component');
