/**
 * Makes `<Link>` prefetching work in the static export.
 *
 * Run automatically after `next build`; see `apps/docs/package.json`.
 *
 * ## The mismatch
 *
 * Next 16's client segment cache asks for one payload per route segment, and it
 * builds that URL by joining the segments with **dots**:
 *
 *     GET /docs/changelog/__next.docs.changelog.__PAGE__.txt
 *
 * `output: 'export'` writes the same payload with **slashes**, as nested
 * directories:
 *
 *     out/docs/changelog/__next.docs/changelog/__PAGE__.txt
 *
 * So every prefetch 404s. On a dev server the two agree, because the request is
 * routed rather than resolved against the filesystem — which is why this is
 * invisible until the export is served, and then it is a 404 per link per page.
 *
 * ## Why this rather than turning prefetch off
 *
 * `prefetch={false}` on every navigation link would silence the console and is
 * what the symptom invites. It also throws away the feature: this is a site whose
 * sidebar carries ~60 links to small static payloads, which is close to the ideal
 * case for prefetching.
 *
 * Navigation itself is unaffected either way — it was verified working while every
 * prefetch was failing, because Next falls back to the full route payload. This
 * is purely the difference between the fast path working and not.
 *
 * ## Safety
 *
 * It only ever COPIES, alongside the original, and only for paths under a
 * `__next.*` directory. If a future Next release emits the flattened name itself,
 * the copy is byte-identical and this becomes a no-op. Nothing here is removed,
 * so a wrong guess about the naming costs disk and not correctness.
 */
import { copyFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'apps/docs/out');

if (!existsSync(outDir)) {
  console.error(`no static export at ${outDir} — run \`next build\` first`);
  process.exit(1);
}

let copied = 0;

/** Every file under `dir`, as paths relative to it. */
function filesUnder(dir: string, prefix = ''): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const full = join(dir, entry);
    const rel = prefix ? `${prefix}/${entry}` : entry;
    return statSync(full).isDirectory() ? filesUnder(full, rel) : [rel];
  });
}

function walk(dir: string): void {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (!statSync(full).isDirectory()) continue;

    if (entry.startsWith('__next.')) {
      // `__next.docs` + `changelog/__PAGE__.txt` → `__next.docs.changelog.__PAGE__.txt`,
      // written beside the `__next.docs` directory rather than inside it.
      for (const rel of filesUnder(full)) {
        const flattened = `${entry}.${rel.split('/').join('.')}`;
        copyFileSync(full + '/' + rel, join(dir, flattened));
        copied += 1;
      }
      continue;
    }

    walk(full);
  }
}

walk(outDir);

console.log(`prefetch payloads → ${copied} flattened alongside their nested originals`);
