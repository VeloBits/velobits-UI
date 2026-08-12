/**
 * Where the shadcn CLI writes our files, and what the imports inside them have to
 * say as a consequence.
 *
 * Shared by `build-registry.ts` (which stamps the targets and rewrites the
 * imports) and `build-docs-data.ts` (which tells the reader where the files land).
 * One module rather than two copies, because the failure mode of a copy here is
 * documentation confidently naming the wrong path — and a wrong path in a "copy
 * and paste this into…" instruction is worse than no instruction.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ## Why the installed layout is FLAT, when the source is not
 *
 * `registry/velobits/` is laid out for the npm build — `ui/`, `lib/`, `hooks/`,
 * `providers/` — because `packages/ui`'s per-entry `exports` map and tsup's entry
 * map are both derived from that shape. The components therefore import each other
 * relatively against it: `from '../lib/cn'`, `from '../ui/tooltip'`.
 *
 * The CLI does not reproduce that shape. It writes each file to the alias its TYPE
 * implies — `registry:ui` → `aliases.ui`, `registry:lib` → `aliases.lib`,
 * `registry:hook` → `aliases.hooks` — which scatters four sibling directories to
 * three unrelated places. And it only rewrites ALIAS-form imports (`@/lib/utils`);
 * a relative specifier is copied through untouched.
 *
 * So before this existed, `add button` produced `components/ui/button.tsx`
 * importing `'../lib/cn'`, resolving to `components/lib/cn`, while `cn` had been
 * written to `lib/cn.ts`. Thirty-eight of thirty-eight components shipped a broken
 * import. The files copied without complaint and then would not compile, which is
 * exactly why it went unnoticed: nothing in this repository ever compiled the
 * installed output.
 *
 * Flattening into one folder fixes it at the root. Every component becomes a
 * sibling of every other, so `./table` and `./tooltip` are true by construction
 * rather than by coincidence of directory depth.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * The one folder everything lands in, inside the consumer's own `ui` alias.
 *
 * `@ui/` is a placeholder the CLI resolves against `components.json`, so a project
 * whose `aliases.ui` is `@/parts/widgets` gets `parts/widgets/velobits/…` — the
 * namespace is ours, the location stays theirs. Verified against a deliberately
 * non-default alias rather than assumed.
 */
export const INSTALL_DIR = '@ui/velobits';

/**
 * `cn` is the one file that does NOT go in that folder. It targets the consumer's
 * `utils` module, so a project already on shadcn ends up with one `cn` instead of
 * two — carrying OUR implementation.
 *
 * `@lib/utils.ts`, not `@utils`: `@utils` is not a placeholder the CLI knows, and
 * passing it writes a literal file called `@utils`. With the default config
 * (`lib: "@/lib"`, `utils: "@/lib/utils"`) the file lands at `lib/utils.ts` and the
 * rewritten `@/lib/utils` import resolves to exactly it.
 *
 * ## This target can collide, and the direction of the collision matters
 *
 * If the consumer already has shadcn's `utils`, the CLI prompts and defaults to
 * **No** — so without `--overwrite` they keep the stock `twMerge(clsx())` and our
 * extended class groups go missing. That is not cosmetic. `registry/velobits/lib/cn.ts`
 * extends tailwind-merge with `rounded-pill`, the `z-*` ladder, the named
 * durations, and a BIDIRECTIONAL `control-material ⇄ shadow` conflict group; lose
 * that last one and two `box-shadow` declarations survive on the same element.
 *
 * The saving asymmetry: ours is a strict SUPERSET. Same signature, same behaviour
 * on every standard utility, plus the extra groups — so overwriting shadcn's copy
 * with ours is safe for their components too, while the reverse silently degrades
 * ours. Which is why every install surface in the docs says to overwrite.
 */
export const UTILS_TARGET = '@lib/utils.ts';

/** The alias-form specifier our components import `cn` through. */
export const UTILS_IMPORT = '@/lib/utils';

/** `registry/velobits/ui/button.tsx` → `@ui/velobits/button.tsx`. */
export function targetFor(path: string): string {
  if (path.endsWith('/lib/cn.ts')) return UTILS_TARGET;
  return `${INSTALL_DIR}/${path.split('/').pop()}`;
}

/**
 * A target with its placeholder expanded to the DEFAULT alias, for display in the
 * docs — "copy this into `components/ui/velobits/button.tsx`" reads as an
 * instruction, where `@ui/velobits/button.tsx` reads as a riddle.
 *
 * The docs say once, next to it, that the prefix follows the reader's own
 * `components.json`; repeating that per file would be noise.
 */
export function displayTarget(target: string): string {
  return target.replace(/^@ui\//, 'components/ui/').replace(/^@lib\//, 'lib/');
}

/**
 * The import rewrites, applied to the compiled registry content.
 *
 * Order matters: `cn` is special-cased to an alias import before the general
 * flattening rule would turn it into `./cn`.
 */
export const IMPORT_REWRITES: [RegExp, string][] = [
  [/(['"])\.\.\/lib\/cn\1/g, `'${UTILS_IMPORT}'`],
  // `../ui/tooltip`, `../hooks/use-theme`, `../lib/theme` → `./tooltip`,
  // `./use-theme`, `./theme`.
  [/(['"])\.\.\/[a-z-]+\/([a-z-]+)\1/g, "'./$2'"],
];
