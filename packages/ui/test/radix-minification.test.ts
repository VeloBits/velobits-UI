import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * The installed `@radix-ui/*` must carry no `@__PURE__`-annotated IIFE.
 *
 * ── THE FAILURE THIS GUARDS ───────────────────────────────────────────────────
 *
 * Radix builds with esbuild's `keepNames`, and in a few places the resulting
 * `/* @__PURE__ *\/ __name(…)` wrapper lands on a function that is immediately
 * invoked. SWC binds the annotation to the OUTER call, finds its result unused,
 * and deletes the invocation , so the function body is simply absent from every
 * minified build while every unminified build, this suite included, looks fine.
 *
 * Three known casualties: the ScrollArea thumb's rAF loop, and typeahead's
 * `updateSearch` in both react-menu and react-select.
 *
 * `scripts/patch-radix-pure-iife.ts` strips the annotation at install time and
 * the root `postinstall` runs it. This test is what notices when that did not
 * happen , a fresh clone installed with `--ignore-scripts`, a lockfile bump that
 * reinstalled a package after the hook, or upstream introducing a fourth site.
 *
 * ── WHY A TEST AND NOT A BUILD STEP ───────────────────────────────────────────
 *
 * Nothing else can see it. The suite runs against unminified source, so the
 * deleted code is present here; the types are unchanged; `publint` and `attw`
 * look at our own package. The only other place it shows up is a production
 * bundle, and by then it is a silent behaviour change in someone's browser.
 *
 * Note this protects THIS repo's builds only. `radix-ui` is a peer dependency,
 * so consumers minify their own copy , which is why `scroll-area.tsx` positions
 * its own thumb rather than trusting the loop this test is about.
 */
const ANNOTATED_IIFE = '(/* @__PURE__ */ __name((function';

/** Walk up from the package to wherever npm hoisted `@radix-ui`. */
function findRadixDirs(from: string): string[] {
  const found: string[] = [];
  let dir = from;
  for (;;) {
    const candidate = join(dir, 'node_modules', '@radix-ui');
    if (existsSync(candidate)) found.push(candidate);
    const parent = dirname(dir);
    if (parent === dir) return found;
    dir = parent;
  }
}

/*
 * `process.cwd()` rather than `import.meta.url`, for the same reason
 * `registry-parity.test.ts` uses it: vitest rewrites import.meta in transformed
 * modules and the URL-relative form resolves somewhere else entirely.
 */
const radixDirs = findRadixDirs(process.cwd());

const offenders = radixDirs.flatMap((radixDir) =>
  readdirSync(radixDir).flatMap((pkg) => {
    const distDir = join(radixDir, pkg, 'dist');
    if (!existsSync(distDir)) return [];
    return readdirSync(distDir)
      .filter((file) => /\.(js|mjs)$/.test(file))
      .filter((file) => readFileSync(join(distDir, file), 'utf8').includes(ANNOTATED_IIFE))
      .map((file) => `@radix-ui/${pkg}/dist/${file}`);
  }),
);

describe('Radix survives minification', () => {
  it('finds an @radix-ui install to check', () => {
    expect(
      radixDirs.length,
      'no @radix-ui directory found , the check below is vacuous',
    ).toBeGreaterThan(0);
  });

  it('has no @__PURE__-annotated IIFE left for SWC to delete', () => {
    expect(
      offenders,
      'run `npm run postinstall` , these files ship with the function body deleted',
    ).toEqual([]);
  });
});
