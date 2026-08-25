/**
 * Generates everything the docs site knows about itself, from the two things
 * that are already true: `registry/registry.ts` and the TypeScript sources.
 *
 * Run: `npm run docs:data` , but you rarely need to. `apps/docs`'s `dev` and
 * `build` scripts both run it first, so a clean clone never sees the output
 * missing, and the output is gitignored precisely so it cannot go stale.
 *
 * Writes into `apps/docs/lib/generated/`:
 *
 *   examples.ts       every file in `apps/docs/registry/examples/` as both a
 *                     component (for the Preview tab) and its literal source
 *                     (for the Code tab)
 *   registry-data.ts  each registry item's metadata plus the source of the files
 *                     it installs, for the Manual install tab
 *   props.ts          prop tables extracted from the TypeScript types
 *
 * and `apps/docs/public/search-index.json` for ⌘K.
 *
 * ## Every code payload is a LIST of languages, not a string
 *
 * Nothing here emits "the source" any more. It emits a `DocCodeVariant[]` , the
 * same block, rendered in each language it can honestly be shown in , and the
 * docs' `CodeBlock` turns that list into a language selector. **Index 0 is the
 * default**, which is the entire mechanism by which TypeScript stays the language
 * you land on: it is listed first. There is no separate "default" field to keep
 * in agreement with the list, because a second source of truth about ordering is
 * a second thing that can disagree with the ordering.
 *
 * The JavaScript entry is derived, never authored , `scripts/code-transform.ts`
 * runs the TypeScript through the compiler's emitter and Prettier. See that file
 * for why the compiler rather than a regex, and for the four things that make it
 * decline to derive anything at all.
 *
 * A variant list is only as long as the truth allows, and most lists here are
 * length one. Two reasons, and neither is a failure:
 *
 *   - The payload is not TypeScript. The theme item's usage snippet is CSS, so it
 *     gets a single-entry CSS list. Offering a JavaScript tab on a CSS block and
 *     then showing the same CSS is worse than offering nothing.
 *   - The payload has no TypeScript in it to strip. A demo that destructures a
 *     hook and returns JSX is already valid JavaScript, and so is every one of
 *     the 48 usage snippets in `content.ts` , they are import lines and JSX, and
 *     not one of them carries an annotation. Their JavaScript tab would be their
 *     TypeScript tab.
 *
 * A one-entry list is how a block knows to render no selector, so in both cases
 * the control's absence is the accurate statement that there is nothing to choose
 * between. The run prints the split, with reasons, because a missing selector on
 * the page looks the same whether it was a decision or a bug.
 *
 * Examples carry the variant axis TWICE, crossed with the distribution axis they
 * already had: `npm` (the barrel import) and `cli` (the per-file imports the
 * shadcn CLI installs) are each a full variant list. Four payloads per example.
 * The order the two axes are applied in is not free , `toCliSource` matches an
 * import line with an anchored regex, so it has to see Prettier's line breaks
 * rather than the emitter's. Hence: transpile, format, and only then rewrite the
 * imports, on both languages independently.
 *
 * ## ⚠️ The second language costs about 60% more output, on purpose
 *
 * Highlighted HTML already dominated this directory (~3.4 MB of ~4.4 MB), and
 * every derived variant is another copy of it: 4.4 MB before the variant axis,
 * ~7.2 MB after, with the JavaScript renderings about 37% of all variant bytes.
 * It would be much worse if every payload derived , the registry sources do, but
 * only 11 of 52 examples and none of the usage snippets have any TypeScript to
 * strip.
 *
 * The alternative , highlighting in the browser , trades a one-time download for
 * a flash of unstyled code on every code tab, on a site that is a static export
 * precisely so it does not do work at render time. The total is printed at the
 * end of the run so the number is at least never a surprise.
 *
 * ## Why generate rather than read at render time
 *
 * The site is a static export, so a Server Component *could* just `readFileSync`
 * during the build and get the same bytes. Generating first buys two things that
 * matter more than the indirection costs: the parse happens once for ~90 files
 * instead of once per page that mentions them, and `tsc --noEmit` type-checks the
 * result , a renamed example is a type error in `apps/docs`, not a blank preview
 * discovered by looking at the deployed page.
 *
 * ## ⚠️ The generated files must stay out of Tailwind's scan
 *
 * They embed component sources as JSON-escaped string literals. Tailwind scans
 * plain text, so a `"` that a component legitimately has inside an arbitrary
 * value arrives as `\"`, and Lightning CSS rejects the resulting declaration as
 * `BadUrl` , taking the whole stylesheet down with a 500 rather than dropping one
 * rule. `app/globals.css` carries the matching `@source not` lines. This is the
 * same failure that already forced one for `public/r`.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { basename, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { withCustomConfig, type PropItem } from 'react-docgen-typescript';
import { codeToHtml } from 'shiki';
import ts from 'typescript';

import { registry } from '../registry/registry.ts';
import { COMPONENT_CONTENT } from '../apps/docs/content/components.ts';
import { COMPONENT_GROUPS, GROUPED_COMPONENT_NAMES, GUIDE_NAV } from '../apps/docs/lib/docs-nav.ts';
import {
  identicalTransforms,
  sameCode,
  skippedTransforms,
  tsToJs,
  type TransformSkip,
} from './code-transform.ts';
import { displayTarget, importSpecifierFor, targetFor } from './registry-layout.ts';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const docsDir = join(root, 'apps/docs');
const examplesDir = join(docsDir, 'registry/examples');
const outDir = join(docsDir, 'lib/generated');

const BANNER = `/* GENERATED by scripts/build-docs-data.ts , do not edit, do not commit. */\n`;

mkdirSync(outDir, { recursive: true });

/* ── Syntax highlighting, at BUILD time ────────────────────────────────────── */

/**
 * Shiki runs here and ships HTML, so the browser downloads no highlighter and no
 * grammar , which for a static site is the difference between a code tab that
 * paints with the page and one that flashes plain text first.
 *
 * `defaultColor: false` is what makes one string serve both themes: Shiki emits
 * `--shiki-light` and `--shiki-dark` custom properties per token instead of a
 * baked-in colour, and `app/globals.css` picks between them off the `dark` class.
 * The alternative , highlighting twice and hiding one , doubles the payload to
 * show the same characters.
 */
async function highlight(code: string, lang: string): Promise<string> {
  return codeToHtml(code, {
    lang,
    themes: { light: 'github-light', dark: 'github-dark' },
    defaultColor: false,
  });
}

/* ── Language variants ─────────────────────────────────────────────────────── */

/**
 * One rendering of a code payload, in one language. Mirrors `CodeVariant` in
 * `registry/velobits/lib/code-languages.ts`, which is what the docs' `CodeBlock`
 * consumes , the field is `code` and not `source` for exactly that reason.
 */
interface DocCodeVariant {
  language: string;
  code: string;
  html: string;
}

/**
 * The interface, as text, for the generated files to declare for themselves.
 *
 * This script mirrors its interfaces into each output rather than importing them
 * from one shared module, so that a generated file is readable on its own and
 * `apps/docs` has nothing to import from `scripts/`. Three files need this one,
 * so it is a constant instead of three copies that can drift.
 */
const DOC_CODE_VARIANT_INTERFACE =
  `export interface DocCodeVariant {\n` +
  `  /** A CODE_LANGUAGES id: 'ts' | 'js' | 'css' | … */\n` +
  `  language: string;\n` +
  `  /** The literal code, for the copy button. */\n` +
  `  code: string;\n` +
  `  /** Shiki markup for \`code\`, built at build time. */\n` +
  `  html: string;\n` +
  `}\n\n`;

/**
 * Which Shiki grammar paints a given language id.
 *
 * A mapping and not an identity because the ids are about what a reader CHOOSES
 * and the grammars are about how it is coloured, and the two do not line up: `ts`
 * and `tsx` are one grammar here because every payload in this repo that is
 * TypeScript is also potentially JSX, and highlighting a component with the
 * plain `ts` grammar loses the tags. Unknown ids fall through to the id itself,
 * which is right for the ones that already agree (`css`).
 */
const GRAMMAR_FOR: Record<string, string> = {
  ts: 'tsx',
  tsx: 'tsx',
  js: 'jsx',
  jsx: 'jsx',
  css: 'css',
};

/** Highlight one payload and label it, without deriving anything. */
async function variant(language: string, code: string): Promise<DocCodeVariant> {
  return { language, code, html: await highlight(code, GRAMMAR_FOR[language] ?? language) };
}

/**
 * A TypeScript payload, plus its mechanically derived JavaScript when there IS a
 * derived JavaScript worth showing , in that order, so TypeScript is the default
 * by virtue of being first.
 *
 * Whether the second entry exists is `scripts/code-transform.ts`'s call, not
 * this file's: a snippet whose JavaScript cannot be trusted gets no second
 * language, and a one-entry list is how the block knows to render no selector.
 *
 * ⚠️ That is now a NARROW rule, and it used to be a wide one. It also refused the
 * case where the two languages print the same characters , which measured as *every
 * one of the 48 Usage snippets*, i.e. the selector disappeared from the most
 * prominent block on every component page. `tsToJs` now returns those unchanged
 * with `derived: false`; see its {@link TsToJsResult} docblock for why an identical
 * rendering is still worth showing.
 */
async function tsJsVariants(source: string, fileName: string): Promise<DocCodeVariant[]> {
  const js = await tsToJs(source, fileName);
  const variants = [await variant('ts', source)];
  if (js !== null) variants.push(await variant('js', js.code));
  return variants;
}

/**
 * How many payloads each section handed to the transform, so the report can say
 * what fraction of each got a JavaScript variant. `skippedTransforms` grows in
 * call order, so a section's skips are the slice added while it ran.
 */
const transformCounts: {
  section: string;
  total: number;
  skips: TransformSkip[];
  identical: TransformSkip[];
}[] = [];

/** Open a tally for one section; call the returned function once it has run. */
function countTransforms(section: string, total: number): () => void {
  const fromSkips = skippedTransforms.length;
  const fromIdentical = identicalTransforms.length;
  return () =>
    transformCounts.push({
      section,
      total,
      skips: skippedTransforms.slice(fromSkips).map((entry) => entry.reason),
      identical: identicalTransforms.slice(fromIdentical).map((entry) => entry.reason),
    });
}

/* ── 0. The sidebar must place every registry item ─────────────────────────── */

/**
 * `apps/docs/lib/docs-nav.ts` is the one hand-maintained list in the docs, and
 * this is what stops it drifting. The tiers live as section comments inside
 * `registry/registry.ts`, so there is no exported structure to derive them from
 * , but an unplaced item is a component with a page nobody can navigate to, and
 * that is exactly the kind of gap that survives review. So it fails the build,
 * by name.
 */
const registryNames = registry.items.map((i) => i.name);
const ungrouped = registryNames.filter((n) => !GROUPED_COMPONENT_NAMES.includes(n));
const phantom = GROUPED_COMPONENT_NAMES.filter((n) => !registryNames.includes(n));

if (ungrouped.length || phantom.length) {
  if (ungrouped.length) {
    console.error(
      `\napps/docs/lib/docs-nav.ts places no group for ${ungrouped.length} registry item(s):\n  ` +
        ungrouped.join('\n  ') +
        '\nEach one still gets a page at /docs/components/<name>, but nothing in the sidebar links to it.',
    );
  }
  if (phantom.length) {
    console.error(
      `\napps/docs/lib/docs-nav.ts lists ${phantom.length} name(s) that are not in the registry:\n  ` +
        phantom.join('\n  ') +
        '\nThese would render as 404s from the sidebar.',
    );
  }
  process.exit(1);
}

/* ── The CLI variant of an example ─────────────────────────────────────────── */

/**
 * Which installed file each exported name comes from.
 *
 * The npm package has a barrel, so an example imports `{ Card, CardHeader }` from
 * `@velobitsio/ui` in one line. The CLI installs one file per component and no
 * barrel at all, so the same example is several import lines, and which line a
 * name belongs on is decided by the registry item that exports it.
 *
 * Parsed from the sources rather than listed, for the same reason the icon grid
 * enumerates its module: a hand-kept table of 215 exports is a table that goes
 * stale, and the failure is silent because a wrong import still renders here.
 */
const ownerOf = new Map<string, string>();
for (const item of registry.items) {
  for (const file of item.files ?? []) {
    const src = readFileSync(join(root, file.path), 'utf8');
    const names = new Set<string>();
    const declared = /^export\s+(?:const|function|class|interface|type|enum)\s+([A-Za-z0-9_]+)/gm;
    for (const m of src.matchAll(declared)) names.add(m[1]);
    for (const m of src.matchAll(/^export\s*\{([^}]+)\}/gm)) {
      for (const part of m[1].split(',')) {
        const name = part
          .trim()
          .split(/\s+as\s+/)
          .pop()
          ?.trim()
          .replace(/^type\s+/, '');
        if (name) names.add(name);
      }
    }
    for (const name of names) if (!ownerOf.has(name)) ownerOf.set(name, file.path);
  }
}

/** One import line, wrapped the way Prettier would wrap it at 100 columns. */
function importLine(specifier: string, names: string[], typeOnly: boolean): string {
  const kind = typeOnly ? 'import type' : 'import';
  const oneLine = `${kind} { ${names.join(', ')} } from '${specifier}';`;
  if (oneLine.length <= 100) return oneLine;
  const body = names.map((n) => `  ${n},`).join('\n');
  return `${kind} {\n${body}\n} from '${specifier}';`;
}

/**
 * Rewrites an example's `@velobitsio/ui` imports into the per-file imports a CLI
 * consumer writes, and leaves every other import alone.
 *
 * `@velobitsio/icons` and `@velobitsio/tokens` deliberately survive untouched: the
 * registry items declare those two as npm DEPENDENCIES, so a CLI consumer installs
 * them from npm and imports them exactly as an npm consumer does. Rewriting them
 * would describe an install that never happens.
 *
 * Returns null when a name cannot be attributed to a file, which the caller turns
 * into a build failure. The alternative is an example shown with a stale import,
 * and since nothing in this repo compiles the installed output, nothing else would
 * catch it.
 */
function toCliSource(source: string): string | null {
  let unresolved: string | null = null;

  const barrel = /^import\s+(type\s+)?\{([^}]+)\}\s+from\s+'@velobitsio\/ui(?:\/[a-z-]+)?';$/gm;

  const out = source.replace(barrel, (line, typeOnly: string | undefined, inner: string) => {
    const groups = new Map<string, string[]>();
    for (const raw of inner.split(',')) {
      const spec = raw.trim();
      if (!spec) continue;
      const isType = /^type\s+/.test(spec);
      const bare = spec.replace(/^type\s+/, '');
      const name = bare.split(/\s+as\s+/)[0].trim();
      const path = ownerOf.get(name);
      if (!path) {
        unresolved = name;
        return line;
      }
      const specifier = importSpecifierFor(path);
      if (!groups.has(specifier)) groups.set(specifier, []);
      groups.get(specifier)!.push(typeOnly || !isType ? bare : `type ${bare}`);
    }
    return [...groups.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([specifier, names]) => importLine(specifier, names.sort(), Boolean(typeOnly)))
      .join('\n');
  });

  if (unresolved) {
    console.error(
      `${unresolved} is imported from '@velobitsio/ui' by an example, but no registry item exports it, so the CLI tab cannot say which file it comes from`,
    );
    return null;
  }
  return out;
}

/* ── 1. Examples ───────────────────────────────────────────────────────────── */

const exampleFiles = existsSync(examplesDir)
  ? readdirSync(examplesDir)
      .filter((f) => f.endsWith('.tsx'))
      .sort()
  : [];

if (!exampleFiles.length) {
  console.error(`no examples found in ${examplesDir} , every Preview tab would be empty`);
  process.exit(1);
}

const exampleImports: string[] = [];
const exampleEntries: string[] = [];
const closeExampleCount = countTransforms('examples', exampleFiles.length);

for (const [index, file] of exampleFiles.entries()) {
  const name = file.replace(/\.tsx$/, '');
  const source = readFileSync(join(examplesDir, file), 'utf8').trimEnd();
  const ident = `Example${index}`;

  // A path alias rather than a relative one: this file lives in `lib/generated`,
  // and `../../registry/examples/x` is only correct while it stays there.
  exampleImports.push(`import ${ident} from '@/registry/examples/${name}';`);

  /*
   * The two axes, applied in the one order that works.
   *
   * `toCliSource` matches a barrel import with a regex anchored to physical line
   * starts and ends. It copes with a Prettier-wrapped multi-line import , the
   * inner `[^}]+` spans newlines , but it is matching TEXT, so it has to be
   * looking at final text. Transpiling after the rewrite would hand the emitter
   * several import lines and get back whatever it felt like wrapping them to;
   * formatting after the rewrite would reflow lines the rewrite just authored.
   * So: transpile, format, THEN rewrite , independently for each language.
   *
   * A null from either rewrite is a real failure rather than a missing nicety:
   * it means an example imports something no registry item exports, so one of
   * the two distributions cannot run it. Which language failed is named, because
   * the JavaScript path can fail where the TypeScript one did not , `import type`
   * lines are elided by the transform, so the two rewrites are not looking at the
   * same set of imports.
   *
   * `tsToJs` returning null is a different thing entirely and is NOT a failure:
   * it means this example has no JavaScript rendering worth a tab, so both
   * flavours are TypeScript-only and neither shows a selector.
   */
  const js = await tsToJs(source, `examples/${file}`);
  const jsSource = js?.code ?? null;

  const cliSource = toCliSource(source);
  if (cliSource === null) {
    console.error(`could not build the CLI import variant of ${file} (TypeScript)`);
    process.exit(1);
  }

  const npm = [await variant('ts', source)];
  const cli = [await variant('ts', cliSource)];

  if (jsSource !== null) {
    const cliJsSource = toCliSource(jsSource);
    if (cliJsSource === null) {
      console.error(`could not build the CLI import variant of ${file} (derived JavaScript)`);
      process.exit(1);
    }

    npm.push(await variant('js', jsSource));

    /*
     * The CLI flavour gets its own last look. The rewrite runs over both
     * languages, and it can erase the only thing that distinguished them , a
     * type-only barrel import, say , leaving two identical blocks behind a
     * selector that claims otherwise. Rare, and cheap to rule out.
     */
    if (!sameCode(cliSource, cliJsSource)) cli.push(await variant('js', cliJsSource));
  }

  exampleEntries.push(
    `  ${JSON.stringify(name)}: {\n` +
      `    name: ${JSON.stringify(name)},\n` +
      `    Component: ${ident},\n` +
      `    npm: ${JSON.stringify(npm)},\n` +
      `    cli: ${JSON.stringify(cli)},\n` +
      `  },`,
  );
}

closeExampleCount();

writeFileSync(
  join(outDir, 'examples.ts'),
  BANNER +
    `import type { ComponentType } from 'react';\n\n` +
    exampleImports.join('\n') +
    `\n\n` +
    DOC_CODE_VARIANT_INTERFACE +
    `export interface DocExample {\n` +
    `  name: string;\n` +
    `  Component: ComponentType;\n` +
    `  /** Barrel-import flavour. [0] is the default language. */\n` +
    `  npm: DocCodeVariant[];\n` +
    `  /** shadcn-CLI per-file-import flavour. [0] is the default language. */\n` +
    `  cli: DocCodeVariant[];\n` +
    `}\n\n` +
    `export const examples: Record<string, DocExample> = {\n` +
    exampleEntries.join('\n') +
    `\n};\n`,
  'utf8',
);

/* ── 2. Registry metadata + installable sources ────────────────────────────── */

interface EmittedFile {
  path: string;
  /** Where the shadcn CLI lands it in a consumer's tree. */
  target: string;
  /** TypeScript first, then the derived JavaScript. */
  variants: DocCodeVariant[];
}

interface EmittedItem {
  name: string;
  type: string;
  title: string;
  description: string;
  group: string;
  dependencies: string[];
  devDependencies: string[];
  registryDependencies: string[];
  files: EmittedFile[];
}

/**
 * Where the CLI writes each file, spelled with the default aliases so it reads as
 * an instruction. Derived from `scripts/registry-layout.ts` , the same module
 * `build-registry.ts` stamps the real targets from, so the path in the docs cannot
 * disagree with the path the CLI uses.
 */
function installTarget(path: string): string {
  return displayTarget(targetFor(path));
}

const groupOf = new Map<string, string>();
for (const group of COMPONENT_GROUPS) {
  for (const name of group.names) groupOf.set(name, group.title);
}

const emittedItems: EmittedItem[] = [];
const closeRegistryCount = countTransforms(
  'registry files',
  registry.items.reduce((total, item) => total + (item.files?.length ?? 0), 0),
);

for (const item of registry.items) {
  const files: EmittedFile[] = [];
  for (const file of item.files ?? []) {
    const source = readFileSync(join(root, file.path), 'utf8').trimEnd();
    files.push({
      path: file.path,
      target: file.target ?? installTarget(file.path),
      // Every installable file is `.ts` or `.tsx`, so every one is a candidate.
      // The path is never opened , it only picks the dialect and labels the
      // entry if the transform decides there is nothing to show.
      variants: await tsJsVariants(source, file.path),
    });
  }

  emittedItems.push({
    name: item.name,
    type: item.type,
    title: item.title ?? item.name,
    description: item.description ?? '',
    group: groupOf.get(item.name) ?? 'Other',
    dependencies: [...(item.dependencies ?? [])],
    devDependencies: [...(item.devDependencies ?? [])],
    registryDependencies: [...(item.registryDependencies ?? [])],
    files,
  });
}

closeRegistryCount();

writeFileSync(
  join(outDir, 'registry-data.ts'),
  BANNER +
    DOC_CODE_VARIANT_INTERFACE +
    `export interface DocRegistryFile {\n` +
    `  path: string;\n` +
    `  /** Where the shadcn CLI lands it in a consumer's tree. */\n` +
    `  target: string;\n` +
    `  /** TypeScript at [0], derived JavaScript at [1]. */\n` +
    `  variants: DocCodeVariant[];\n` +
    `}\n\n` +
    `export interface DocRegistryItem {\n` +
    `  name: string;\n` +
    `  type: string;\n` +
    `  title: string;\n` +
    `  description: string;\n` +
    `  group: string;\n` +
    `  dependencies: string[];\n` +
    `  devDependencies: string[];\n` +
    `  registryDependencies: string[];\n` +
    `  files: DocRegistryFile[];\n` +
    `}\n\n` +
    `export const registryItems: DocRegistryItem[] = ${JSON.stringify(emittedItems, null, 2)};\n\n` +
    `export const registryItemsByName: Record<string, DocRegistryItem> = Object.fromEntries(\n` +
    `  registryItems.map((item) => [item.name, item]),\n` +
    `);\n`,
  'utf8',
);

/* ── 3. Prop tables, from the TypeScript types ─────────────────────────────── */

/**
 * Props are extracted rather than written, because a hand-written table for 39
 * components is 39 places for the documentation to disagree with the code , and
 * it disagrees silently, which is the worst way for documentation to be wrong.
 *
 * The filter is a DENYLIST of the packages a component forwards to, not an
 * allowlist of our own files. That is deliberate: `VariantProps<typeof
 * buttonVariants>` resolves through `class-variance-authority`, so an
 * "only props declared in registry/velobits" rule would drop `variant` and
 * `size` , the two props anyone actually came to read.
 */
const FORWARDED_FROM = [
  'node_modules/@types/react',
  'node_modules/radix-ui',
  'node_modules/@radix-ui',
  'node_modules/framer-motion',
  'node_modules/react-hook-form',
  'node_modules/cmdk',
  'node_modules/typescript/lib',
];

const parser = withCustomConfig(join(docsDir, 'tsconfig.json'), {
  savePropValueAsString: true,
  shouldExtractLiteralValuesFromEnum: true,
  shouldRemoveUndefinedFromOptional: true,
  skipChildrenPropWithoutDoc: false,
  propFilter: (prop: PropItem) => {
    const declarations = prop.declarations ?? [];
    if (!declarations.length) return true;
    // Normalised because these are Windows paths here and POSIX paths in CI.
    return !declarations.every((d) =>
      FORWARDED_FROM.some((needle) => d.fileName.replace(/\\/g, '/').includes(needle)),
    );
  },
});

/**
 * `cva`'s `defaultVariants`, read straight from the AST.
 *
 * react-docgen-typescript reports a default only when it can see a
 * `defaultProps` or a destructured parameter default. A cva variant has neither:
 * the fallback lives in the config object passed to `cva()`, several statements
 * above the component. So the most useful column in the table , what you get if
 * you pass nothing , would be empty for exactly the props that have interesting
 * defaults.
 */
function cvaDefaults(sourceFile: ts.SourceFile): Record<string, string> {
  const defaults: Record<string, string> = {};

  const visit = (node: ts.Node): void => {
    if (
      ts.isCallExpression(node) &&
      ts.isIdentifier(node.expression) &&
      node.expression.text === 'cva' &&
      node.arguments.length > 1
    ) {
      const config = node.arguments[1];
      if (config && ts.isObjectLiteralExpression(config)) {
        for (const prop of config.properties) {
          if (
            ts.isPropertyAssignment(prop) &&
            prop.name.getText(sourceFile) === 'defaultVariants' &&
            ts.isObjectLiteralExpression(prop.initializer)
          ) {
            for (const entry of prop.initializer.properties) {
              if (!ts.isPropertyAssignment(entry)) continue;
              defaults[entry.name.getText(sourceFile).replace(/^['"]|['"]$/g, '')] =
                entry.initializer.getText(sourceFile).replace(/^'|'$/g, '"');
            }
          }
        }
      }
    }
    ts.forEachChild(node, visit);
  };

  visit(sourceFile);
  return defaults;
}

/**
 * react-docgen-typescript reports a hand-written union (`surface?: 'glass' | 'panel'`)
 * as the literal string `"enum"`, with the members hiding in `type.value`. A
 * table column reading "enum" tells a reader nothing they did not already know,
 * so the members are put back. Unions it expands itself , the cva-derived ones ,
 * arrive already spelled out and pass through untouched.
 */
function typeName(type: PropItem['type']): string {
  if (type.name !== 'enum' || !Array.isArray(type.value)) return type.name;

  const members = (type.value as { value?: unknown }[])
    .map((member) => String(member.value ?? ''))
    .filter((value) => value !== '' && value !== 'undefined');

  return members.length ? members.join(' | ') : type.name;
}

/**
 * The two default-value sources disagree about quoting: a destructured parameter
 * default arrives as `glass`, while the cva `defaultVariants` pass produces
 * `"glass"`. Both describe a string, and a table showing one of each reads as if
 * the difference were meaningful.
 */
function normaliseDefault(value: string | null, type: string): string | null {
  if (value == null) return null;
  if (/^["'`]/.test(value)) return value.replace(/'/g, '"');
  // Only quote when the type says it is a string literal, so `0`, `false` and
  // `() => {}` are left alone.
  return type.includes(`"${value}"`) ? `"${value}"` : value;
}

interface DocProp {
  name: string;
  type: string;
  required: boolean;
  defaultValue: string | null;
  description: string;
}

interface DocPropGroup {
  displayName: string;
  props: DocProp[];
}

const componentProps: Record<string, DocPropGroup[]> = {};
const noProps: string[] = [];

for (const item of registry.items) {
  const file = item.files?.[0];
  if (!file) continue;

  const absolute = join(root, file.path);
  const source = readFileSync(absolute, 'utf8');
  const defaults = cvaDefaults(
    ts.createSourceFile(absolute, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX),
  );

  let parsed;
  try {
    parsed = parser.parse([absolute]);
  } catch (error) {
    // A component whose types defeat the parser is a missing table, not a failed
    // build , the rest of its page is still correct and still worth shipping.
    console.warn(`  props: ${item.name} could not be parsed (${(error as Error).message})`);
    noProps.push(item.name);
    continue;
  }

  const groups: DocPropGroup[] = parsed
    .map((component) => ({
      displayName: component.displayName,
      props: Object.values(component.props)
        .map((prop): DocProp => {
          const type = typeName(prop.type);
          const raw =
            prop.defaultValue?.value != null
              ? String(prop.defaultValue.value)
              : (defaults[prop.name] ?? null);
          return {
            name: prop.name,
            type,
            required: prop.required,
            defaultValue: normaliseDefault(raw, type),
            description: prop.description,
          };
        })
        // A prop the checker resolved to bare `undefined` is one the component
        // explicitly Omits from what it forwards. It is not part of the API, and
        // a row reading `undefined` in the Type column suggests it is.
        .filter((prop) => prop.type !== 'undefined')
        .sort((a, b) => {
          // Required first , they are the ones you cannot skip reading.
          if (a.required !== b.required) return a.required ? -1 : 1;
          return a.name.localeCompare(b.name);
        }),
    }))
    .filter((group) => group.props.length > 0);

  if (groups.length) componentProps[item.name] = groups;
  else noProps.push(item.name);
}

writeFileSync(
  join(outDir, 'props.ts'),
  BANNER +
    `export interface DocProp {\n` +
    `  name: string;\n` +
    `  type: string;\n` +
    `  required: boolean;\n` +
    `  defaultValue: string | null;\n` +
    `  description: string;\n` +
    `}\n\n` +
    `export interface DocPropGroup {\n` +
    `  displayName: string;\n` +
    `  props: DocProp[];\n` +
    `}\n\n` +
    `/** Keyed by registry item name. Absent means the extractor found nothing to show. */\n` +
    `export const componentProps: Record<string, DocPropGroup[]> = ${JSON.stringify(componentProps, null, 2)};\n`,
  'utf8',
);

/* ── 4. Per-component content, validated against what exists ───────────────── */

/**
 * `apps/docs/content/components.ts` is prose, so nothing can derive it , but both
 * halves of every entry point at something that CAN be checked. An example name
 * that does not exist renders an empty preview; a content entry for a component
 * that was removed renders nothing at all. Both are silent, so both fail here.
 */
const exampleNames = new Set(exampleFiles.map((f) => f.replace(/\.tsx$/, '')));
const contentProblems: string[] = [];

/**
 * Words, lowercased and stripped of punctuation, for the duplication check below.
 */
function words(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Longest run of words `note` shares with `description`.
 *
 * ## Why the build cares
 *
 * A component page prints the registry description and then the notes, one after
 * the other. The registry descriptions are already paragraphs of rationale, so a
 * note that restates one reads as padding , the reader hits the same sentence
 * twice and learns to skim both. The first draft of `content.ts` did this on 30
 * notes across 25 pages, which is how this check came to exist.
 *
 * Notes are for what the description does NOT say: the measurement behind a
 * claim, the call site that motivated a prop, the failure mode. Sixteen words is
 * a deliberately loose threshold , it catches a copied sentence without
 * complaining about two paragraphs that necessarily share a component's name and
 * a few connectives.
 */
function longestSharedRun(note: string, description: string): number {
  const noteWords = words(note);
  const haystack = words(description).join(' ');
  let longest = 0;

  for (let start = 0; start < noteWords.length; start += 1) {
    let length = longest;
    // Only ever try to BEAT the current best, so this stays near-linear rather
    // than checking every window.
    while (
      start + length < noteWords.length &&
      haystack.includes(noteWords.slice(start, start + length + 1).join(' '))
    ) {
      length += 1;
      longest = length;
    }
  }

  return longest;
}

const MAX_SHARED_RUN = 16;

for (const [name, content] of Object.entries(COMPONENT_CONTENT)) {
  if (!registryNames.includes(name)) {
    contentProblems.push(`content for "${name}", which is not a registry item`);
  }
  for (const example of content.examples ?? []) {
    if (!exampleNames.has(example.name)) {
      contentProblems.push(
        `"${name}" lists example "${example.name}", which is not a file in apps/docs/registry/examples/`,
      );
    }
  }

  const description = registry.items.find((item) => item.name === name)?.description ?? '';
  (content.notes ?? []).forEach((note, index) => {
    const shared = longestSharedRun(note, description);
    if (shared > MAX_SHARED_RUN) {
      contentProblems.push(
        `"${name}" notes[${index}] repeats ${shared} consecutive words of the registry ` +
          `description, which is printed directly above it. Say what the description does not.`,
      );
    }
  });
}

if (contentProblems.length) {
  console.error(
    '\napps/docs/content/components.ts points at things that do not exist:\n  ' +
      contentProblems.join('\n  '),
  );
  process.exit(1);
}

interface EmittedContent {
  usage: { variants: DocCodeVariant[] } | null;
  examples: { name: string; title: string | null; description: string | null }[];
  notes: string[];
}

const emittedContent: Record<string, EmittedContent> = {};
const closeContentCount = countTransforms(
  'usage snippets',
  Object.values(COMPONENT_CONTENT).filter((content) => content.usage).length - 1 /* the CSS one */,
);

for (const [name, content] of Object.entries(COMPONENT_CONTENT)) {
  emittedContent[name] = {
    usage: content.usage
      ? {
          /*
           * The theme item's snippet is CSS; everything else is TSX. Getting the
           * grammar wrong used to be only wrong colours; now it also decides
           * whether a language selector appears, so the CSS branch is a
           * single-entry list , there is no JavaScript rendering of an
           * `@import`, and offering one would be a lie the reader can click on.
           *
           * These snippets are fragments, not modules , an import line and then a
           * bare JSX expression, in one case with a literal `…` in it. That shape
           * is the one `tsToJs` refuses outright (the emitter reprints sibling
           * elements as a comma sequence), so a good number of these come back
           * TypeScript-only. See `code-transform.ts`; the tally is printed at the
           * end of the run.
           */
          variants:
            name === 'velobits-theme'
              ? [await variant('css', content.usage)]
              : await tsJsVariants(content.usage, `content/${name}.tsx`),
        }
      : null,
    examples: (content.examples ?? []).map((example) => ({
      name: example.name,
      title: example.title ?? null,
      description: example.description ?? null,
    })),
    notes: [...(content.notes ?? [])],
  };
}

closeContentCount();

writeFileSync(
  join(outDir, 'content.ts'),
  BANNER +
    DOC_CODE_VARIANT_INTERFACE +
    `export interface DocContentExample {\n` +
    `  name: string;\n` +
    `  title: string | null;\n` +
    `  description: string | null;\n` +
    `}\n\n` +
    `export interface DocContent {\n` +
    `  /** [0] is the default language. One entry means: show no selector. */\n` +
    `  usage: { variants: DocCodeVariant[] } | null;\n` +
    `  examples: DocContentExample[];\n` +
    `  notes: string[];\n` +
    `}\n\n` +
    `/** Keyed by registry item name. Absent is normal , every field is optional. */\n` +
    `export const componentContent: Record<string, DocContent> = ${JSON.stringify(emittedContent, null, 2)};\n`,
  'utf8',
);

/* ── 5. The ⌘K index ───────────────────────────────────────────────────────── */

interface SearchEntry {
  title: string;
  href: string;
  group: string;
  description: string;
}

const searchIndex: SearchEntry[] = [
  ...emittedItems.map((item) => ({
    title: item.title,
    href: `/docs/components/${item.name}`,
    group: item.group,
    // One line in a palette row. The registry descriptions are paragraphs.
    description: item.description.split(/(?<=\.)\s/)[0] ?? '',
  })),
];

// Guide pages come from the same nav the sidebar renders, so the two cannot
// disagree about what exists.
for (const group of GUIDE_NAV) {
  for (const entry of group.items) {
    searchIndex.push({
      title: entry.title,
      href: entry.href,
      group: group.title,
      description: entry.description ?? '',
    });
  }
}

writeFileSync(
  join(docsDir, 'public/search-index.json'),
  JSON.stringify(searchIndex, null, 2) + '\n',
  'utf8',
);

/* ── 6. The agent skill ────────────────────────────────────────────────────── */

/**
 * `skills/velobits-ui/` is the source, and it leaves here three ways:
 *
 *   public/skills/velobits-ui/…   the files themselves, so the docs origin serves
 *                                 them for the `curl` install and for any agent
 *                                 that can fetch a URL. `velobits-ui.mdc` sits
 *                                 alongside them: the same entry point with
 *                                 Cursor's frontmatter instead of ours
 *   public/r/skill.json           a `registry:file` item whose targets are
 *                                 `.claude/skills/…`, so
 *                                 `npx shadcn add <origin>/r/skill.json` installs
 *                                 it into a consumer's repo
 *   public/r/skill-cursor.json    the same, into `.cursor/rules/`
 *
 * Deliberately NOT an entry in `registry/registry.ts`: it has no source under
 * `registry/velobits/`, and every item in that list gets a component page plus a
 * sidebar slot (section 0 above enforces exactly that). `/docs/skill` is its page.
 * `shadcn build` has already run by the time this does, and it only writes the
 * items it compiled, so one more file in that folder survives.
 *
 * ⚠️ `target` must keep the `~/` prefix. That is the CLI's spelling for "the
 * project root"; without it the path goes through alias resolution instead, and
 * `.claude/…` is not an alias.
 */
const SKILL_NAME = 'velobits-ui';
const skillDir = join(root, 'skills', SKILL_NAME);

const skillReferences = readdirSync(join(skillDir, 'references'))
  .filter((f) => f.endsWith('.md'))
  .sort()
  .map((f) => `references/${f}`);

const skillEntry = readFileSync(join(skillDir, 'SKILL.md'), 'utf8');
const linkedReferences = new Set(
  [...skillEntry.matchAll(/references\/[a-z0-9-]+\.md/g)].map((m) => m[0]),
);

/*
 * Same idea as section 0, for the same reason. A `SKILL.md` pointing at a
 * reference file that is not there sends a model off to invent the answer, which
 * is worse than shipping no skill , and a reference file nothing points at is
 * never read. Neither is visible by looking at the rendered docs, so it fails the
 * build by name instead.
 */
const skillProblems = [
  ...[...linkedReferences]
    .filter((f) => !skillReferences.includes(f))
    .map((f) => `SKILL.md links ${f}, which does not exist`),
  ...skillReferences
    .filter((f) => !linkedReferences.has(f))
    .map((f) => `${f} exists, but SKILL.md never points at it`),
];

if (skillProblems.length) {
  console.error(`\nskills/${SKILL_NAME} is inconsistent:\n  ` + skillProblems.join('\n  '));
  process.exit(1);
}

const skillFiles = ['SKILL.md', ...skillReferences];
const publicSkillDir = join(docsDir, 'public/skills', SKILL_NAME);

/** Read once, then used by all three outputs. */
const skillSources = new Map(
  skillFiles.map((relative) => [relative, readFileSync(join(skillDir, relative), 'utf8')]),
);

for (const [relative, source] of skillSources) {
  const copy = join(publicSkillDir, relative);
  mkdirSync(dirname(copy), { recursive: true });
  writeFileSync(copy, source, 'utf8');
}

/** The frontmatter `description`, so nothing downstream describes it differently. */
const skillDescription =
  /^---\r?\n[\s\S]*?^description:\s*(.+)$/m.exec(skillEntry)?.[1]?.trim() ?? '';

/**
 * Cursor's variant of the same content.
 *
 * `.cursor/rules/` takes `.mdc` files with ITS frontmatter (`description`,
 * `globs`, `alwaysApply`) and **ignores a plain `.md` placed there**, so the entry
 * point is rewritten rather than copied. `alwaysApply: false` with no `globs` is
 * the closest Cursor gets to how a skill behaves: the description is what it
 * matches on, rather than a file pattern.
 *
 * The reference files move to a subfolder, where being ignored by the rules system
 * is exactly right , they are meant to be read on demand, by path, which is also
 * why the links inside the entry are rewritten to point there.
 */
const cursorEntry =
  `---\ndescription: ${skillDescription}\nalwaysApply: false\n---\n\n` +
  skillSources
    .get('SKILL.md')!
    .replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n+/, '')
    .replace(/references\/([a-z0-9-]+\.md)/g, `${SKILL_NAME}/$1`);

writeFileSync(join(publicSkillDir, `${SKILL_NAME}.mdc`), cursorEntry, 'utf8');

/** `[installed path, content]` for each agent's layout. */
const skillLayouts = {
  'skill.json': {
    title: 'VeloBits agent skill',
    docs: `Installed to .claude/skills/${SKILL_NAME}/. A new session picks it up; ask the agent to read SKILL.md before it touches UI.`,
    files: [...skillSources].map(
      ([relative, content]) => [`.claude/skills/${SKILL_NAME}/${relative}`, content] as const,
    ),
  },
  'skill-cursor.json': {
    title: 'VeloBits agent skill, for Cursor',
    docs: `Installed to .cursor/rules/. Reload the window so Cursor re-reads its rules directory.`,
    files: [
      [`.cursor/rules/${SKILL_NAME}.mdc`, cursorEntry] as const,
      ...skillReferences.map(
        (relative) =>
          [
            `.cursor/rules/${SKILL_NAME}/${basename(relative)}`,
            skillSources.get(relative)!,
          ] as const,
      ),
    ],
  },
};

/*
 * What the installer on `/docs/skill` reads. The commands it renders name every
 * reference file one by one (a `curl` loop has to), so deriving the list here is
 * what stops a fifth reference file shipping with a four-file install command.
 */
writeFileSync(
  join(outDir, 'skill.ts'),
  BANNER +
    `/** The skill's directory name, in every agent's layout. */\n` +
    `export const SKILL_NAME = ${JSON.stringify(SKILL_NAME)};\n\n` +
    `/** Paths relative to the skill root, entry point first. */\n` +
    `export const SKILL_FILES: string[] = ${JSON.stringify(skillFiles, null, 2)};\n\n` +
    `/** The frontmatter description, as the registry items and the .mdc carry it. */\n` +
    `export const SKILL_DESCRIPTION = ${JSON.stringify(skillDescription)};\n`,
  'utf8',
);

for (const [fileName, layout] of Object.entries(skillLayouts)) {
  writeFileSync(
    join(docsDir, 'public/r', fileName),
    JSON.stringify(
      {
        $schema: 'https://ui.shadcn.com/schema/registry-item.json',
        name: fileName.replace('.json', ''),
        type: 'registry:file',
        title: layout.title,
        description: skillDescription,
        files: layout.files.map(([installed, content]) => ({
          path: installed,
          content,
          type: 'registry:file',
          target: `~/${installed}`,
        })),
        docs: layout.docs,
      },
      null,
      2,
    ) + '\n',
    'utf8',
  );
}

/* ── 7. Report ─────────────────────────────────────────────────────────────── */

console.log(`docs data → apps/docs/lib/generated/`);
console.log(`  examples.ts       ${exampleFiles.length} examples`);
console.log(`  registry-data.ts  ${emittedItems.length} items`);
console.log(`  content.ts        ${Object.keys(emittedContent).length} items with content`);
console.log(`  props.ts          ${Object.keys(componentProps).length} items with prop tables`);
console.log(`  search-index.json ${searchIndex.length} entries`);
console.log(
  `  skills/${SKILL_NAME}  ${skillFiles.length} files + ${SKILL_NAME}.mdc, plus ${Object.keys(skillLayouts).join(' and ')}`,
);

/*
 * What got a JavaScript variant, and what did not.
 *
 * A single-variant block renders no language selector, which is correct but is
 * also indistinguishable, on the page, from a selector that failed to render. So
 * the split is printed with its reasons: `identical` and `bare-jsx` are the
 * transform working as designed, while `degenerate` means it met something it
 * could not carry across and is the one worth chasing.
 */
console.log(`\njs variants:`);
for (const { section, total, skips, identical } of transformCounts) {
  /*
   * Three numbers, not two, because "has a JavaScript variant" and "the
   * JavaScript differs from the TypeScript" are different facts and conflating
   * them was itself a false claim in the build log: for a while this printed
   * `52/52 derived` for a section in which most snippets were returned unchanged.
   */
  const byReason = identical.reduce<Record<string, number>>((counts, reason) => {
    counts[reason] = (counts[reason] ?? 0) + 1;
    return counts;
  }, {});
  const same = Object.entries(byReason)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([reason, count]) => `${count} ${reason}`)
    .join(', ');
  console.log(
    `  ${section.padEnd(15)} ${total - skips.length}/${total} with a js variant , ` +
      `${total - skips.length - identical.length} genuinely restated` +
      (identical.length ? `, ${identical.length} already js (${same})` : '') +
      (skips.length ? `, ${skips.length} refused` : ''),
  );
}

if (skippedTransforms.length) {
  console.log(
    `\n  no js variant:\n    ` +
      skippedTransforms.map(({ fileName, reason }) => `${fileName} , ${reason}`).join('\n    '),
  );
}

/*
 * The payload, in one number.
 *
 * Highlighted markup is most of what this script writes, and carrying a second
 * language of it is a deliberate trade (see the header). A cost that is never
 * printed is a cost nobody notices growing, so it is printed , with the largest
 * file named, since that is the one any future look at this will start from.
 */
const generatedSizes = readdirSync(outDir)
  .map((file) => [file, statSync(join(outDir, file)).size] as const)
  .sort(([, a], [, b]) => b - a);
const generatedBytes = generatedSizes.reduce((total, [, size]) => total + size, 0);
const mb = (bytes: number): string => `${(bytes / 1_000_000).toFixed(2)} MB`;

console.log(
  `\n  apps/docs/lib/generated/ is now ${mb(generatedBytes)} across ` +
    `${generatedSizes.length} files (largest: ${generatedSizes[0][0]}, ${mb(generatedSizes[0][1])})`,
);

if (noProps.length) {
  /*
   * Printed rather than swallowed. An empty prop table renders as an absent
   * section, which looks identical to "this component has no props" , so without
   * this line a regression in the extractor is invisible until someone goes
   * looking for a prop they know exists.
   */
  console.log(`\n  no props extracted for ${noProps.length}: ${noProps.join(', ')}`);
}
