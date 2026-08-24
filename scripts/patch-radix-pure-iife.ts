/**
 * Un-annotates the three IIFEs in `@radix-ui/*` that minifiers delete.
 *
 * Run: automatically, from the root `postinstall`.
 *
 * ── WHAT IS BROKEN ────────────────────────────────────────────────────────────
 *
 * Radix builds with esbuild's `keepNames`, which wraps functions in `__name()`
 * calls annotated `/* @__PURE__ *\/`. In three places that wrapper lands on an
 * IMMEDIATELY INVOKED function:
 *
 *     ( /* @__PURE__ *\/ __name((function loop() { … }), 'loop') )();
 *
 * SWC binds the annotation to the OUTER call expression, sees that its result is
 * unused, and deletes the invocation. Verified against Next 16's own minifier:
 * the body vanishes with the comment and survives without it.
 *
 * The three casualties, all silent:
 *
 *   react-scroll-area  the rAF loop that moves the thumb. Ships as
 *                      `(e.scrollLeft, e.scrollTop, () => cancelAnimationFrame(0))`.
 *   react-menu         typeahead's `updateSearch`, so `searchRef` is never
 *                      written and multi-character search never accumulates.
 *   react-select       the same function, same consequence.
 *
 * ── WHAT THIS FIXES, AND WHAT IT CANNOT ───────────────────────────────────────
 *
 * This repo's builds only. `radix-ui` is a PEER dependency of `@velobitsio/ui`,
 * so anyone installing from npm minifies their own copy and gets their own dead
 * code, and no install-time script of ours runs in their tree.
 *
 * ScrollArea therefore does not rely on this: `registry/velobits/ui/scroll-area.tsx`
 * positions its own thumb and is correct with or without this patch. Typeahead
 * cannot be fixed the same way , the item collection it walks is Radix-internal ,
 * so for consumers that half waits on upstream.
 *
 * ── WHY A REWRITE AND NOT A .patch FILE ───────────────────────────────────────
 *
 * A diff is pinned to a version and breaks the install on every Radix bump. The
 * pattern is exact, unambiguous and stable, so matching on it survives bumps and
 * simply stops matching once upstream stops emitting it , which is the outcome we
 * want, and why finding nothing is reported rather than treated as an error.
 */
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const radixDir = join(root, 'node_modules', '@radix-ui');

/**
 * The annotation, and only where it precedes a parenthesised function about to
 * be invoked. `/* @__PURE__ *\/ __name(` on its own is on ~every declaration in
 * every Radix file and is doing its job there; stripping those would cost real
 * tree-shaking for no reason.
 */
const ANNOTATED_IIFE = '(/* @__PURE__ */ __name((function';
const REPLACEMENT = '(__name((function';

let scanned = 0;
const patched: string[] = [];

let packages: string[];
try {
  packages = readdirSync(radixDir);
} catch {
  /* No install to patch , `--ignore-scripts`, or a partial install. Not our problem to report. */
  process.exit(0);
}

for (const pkg of packages) {
  const distDir = join(radixDir, pkg, 'dist');
  let files: string[];
  try {
    files = readdirSync(distDir);
  } catch {
    continue;
  }

  for (const file of files) {
    if (!/\.(js|mjs)$/.test(file)) continue;
    const path = join(distDir, file);
    const source = readFileSync(path, 'utf8');
    scanned++;
    if (!source.includes(ANNOTATED_IIFE)) continue;

    const occurrences = source.split(ANNOTATED_IIFE).length - 1;
    writeFileSync(path, source.replaceAll(ANNOTATED_IIFE, REPLACEMENT), 'utf8');
    patched.push(`@radix-ui/${pkg}/dist/${file} (${occurrences})`);
  }
}

if (patched.length === 0) {
  /*
   * Idempotent, so this is also what a second run prints. Either way there is
   * nothing left to delete, which is the only thing this script cares about.
   */
  console.log(`radix @__PURE__ IIFE patch: nothing to do (${scanned} files scanned)`);
} else {
  console.log(`radix @__PURE__ IIFE patch: ${patched.length} file(s) rewritten`);
  for (const entry of patched) console.log(`  ${entry}`);
}
