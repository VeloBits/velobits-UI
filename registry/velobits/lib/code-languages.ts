/**
 * The language registry behind a `CodeBlock`'s language selector.
 *
 * ## Why this is a registry and not a union
 *
 * The obvious shape for "which language is this block in" is a string union of
 * the ones we ship. It is wrong for the same reason a hard-coded colour scale is
 * wrong: the set is open. A consumer documenting a Python SDK alongside these
 * components needs `python` to be a first-class entry with its own label and its
 * own accent, and a union means editing this file to get one.
 *
 * So a language is DATA. {@link CODE_LANGUAGES} is the set we ship,
 * {@link registerCodeLanguages} is how anyone adds to it, and every field that
 * decides how the selector looks , label, accent, class , travels with the
 * definition rather than living in the component.
 *
 * ## What a language does NOT do
 *
 * Registering a language does not conjure code in it. A block offers a language
 * when, and only when, it was given a variant for that language , either derived
 * (the TypeScript → JavaScript transform the docs build runs) or authored by
 * hand. This is deliberate: a selector that offers Vue on a React component and
 * then shows React code is worse than no selector at all.
 *
 * @example Adding a language with its own design
 * ```ts
 * registerCodeLanguages([
 *   {
 *     id: 'python',
 *     label: 'Python',
 *     shortLabel: 'PY',
 *     grammar: 'python',
 *     extension: '.py',
 *     accent: '#3776ab',
 *   },
 * ]);
 * ```
 */

/**
 * One language a code block can be shown in.
 *
 * `id` is the key everything else joins on: the build writes it onto a variant,
 * the selector reads it back, and a consumer's `onLanguageChange` receives it.
 * Keep it short and stable , it is a public identifier, not a label.
 */
export interface CodeLanguage {
  /** Stable key. Lowercase, no spaces. */
  id: string;
  /** Full name, used as the option's accessible name. */
  label: string;
  /**
   * What the selector actually prints. A selector sits in a code block's
   * top-right corner, so "TS" fits where "TypeScript" does not.
   * Defaults to `label` when absent.
   */
  shortLabel?: string;
  /**
   * Highlighter grammar id (Shiki's naming). Separate from `id` because several
   * ids share a grammar , `ts` and `tsx` are both highlighted as `tsx` here, and
   * a consumer may register two dialects over one grammar.
   */
  grammar?: string;
  /** File extension, for a block that names the file it is showing. */
  extension?: string;
  /**
   * The language's colour, as any CSS colour or `var()`. Painted as the option's
   * indicator so the choice is not carried by position alone.
   *
   * Left undefined for our own entries on purpose: the built-in set inherits the
   * system's `--primary`, so the control matches every other control in the
   * library. Set it when a language has a colour readers already know it by.
   */
  accent?: string;
  /**
   * Escape hatch for a design the fields above cannot express. Merged onto the
   * option, so `cn`'s conflict resolution applies and these classes win.
   */
  className?: string;
}

/**
 * The languages this library ships, keyed by id.
 *
 * Two of these , `ts` and `js` , are the pair the docs build derives
 * mechanically. The rest are here so a block that is *authored* in them gets a
 * correct label and grammar without every consumer redeclaring the basics.
 */
export const CODE_LANGUAGES: Record<string, CodeLanguage> = {
  ts: { id: 'ts', label: 'TypeScript', shortLabel: 'TS', grammar: 'tsx', extension: '.tsx' },
  js: { id: 'js', label: 'JavaScript', shortLabel: 'JS', grammar: 'jsx', extension: '.jsx' },
  css: { id: 'css', label: 'CSS', shortLabel: 'CSS', grammar: 'css', extension: '.css' },
  json: { id: 'json', label: 'JSON', shortLabel: 'JSON', grammar: 'json', extension: '.json' },
  bash: { id: 'bash', label: 'Bash', shortLabel: 'sh', grammar: 'bash', extension: '.sh' },
  html: { id: 'html', label: 'HTML', shortLabel: 'HTML', grammar: 'html', extension: '.html' },
  md: { id: 'md', label: 'Markdown', shortLabel: 'MD', grammar: 'markdown', extension: '.md' },
};

/**
 * Consumer additions, kept apart from {@link CODE_LANGUAGES} so a registration
 * can never silently rewrite one of ours and so `resolveCodeLanguage` has a
 * defined precedence to state: custom wins.
 */
const custom = new Map<string, CodeLanguage>();

/**
 * Add or override languages, once, at app entry.
 *
 * Module-level rather than a React context on purpose. A context would make the
 * language set a render-time concern, which means a provider every consumer must
 * remember and a re-render whenever it changes , to configure something that is
 * static for the life of the app. It also keeps the barrel's byte budget intact:
 * this is a Map and a function, not a provider tree.
 *
 * Overriding one of ours is allowed and is the supported way to restyle it, e.g.
 * giving `ts` TypeScript's own blue.
 */
export function registerCodeLanguages(languages: CodeLanguage[]): void {
  for (const language of languages) custom.set(language.id, language);
}

/** Drop all consumer registrations. Exists for tests; harmless in an app. */
export function resetCodeLanguages(): void {
  custom.clear();
}

/**
 * Look up a language, falling back to a usable definition rather than throwing.
 *
 * A missing entry is a labelling problem, not a rendering one: the block still
 * has code and must still show it. So an unknown id becomes its own label , the
 * selector reads `graphql` instead of going blank , and the only thing lost is
 * the nicety of a short label and an accent.
 */
export function resolveCodeLanguage(id: string): CodeLanguage {
  return custom.get(id) ?? CODE_LANGUAGES[id] ?? { id, label: id };
}

/** What the selector prints for `id`. */
export function codeLanguageLabel(id: string): string {
  const language = resolveCodeLanguage(id);
  return language.shortLabel ?? language.label;
}

/**
 * One rendering of a block, in one language.
 *
 * `code` is the literal text , the copy button's payload, and the fallback the
 * block renders when nothing pre-highlighted it. `html` is optional because the
 * primitive ships no highlighter (see `code-block.tsx`); the docs fill it in from
 * Shiki at build time, and an app without a build step simply omits it.
 */
export interface CodeVariant {
  /** A {@link CodeLanguage} id. */
  language: string;
  /** The literal code. */
  code: string;
  /** Pre-highlighted markup for `code`, if something highlighted it. */
  html?: string;
}

/**
 * Normalise the two shapes a caller may pass into an ordered variant list.
 *
 * The record form (`{ ts: '…', js: '…' }`) is what a hand-written block wants;
 * the array form is what generated data produces and the only one that can fix
 * an order. Both collapse to the array, and **the first entry is the default** ,
 * which is what makes "keep the current language as the default" fall out of
 * simply listing the block's own language first.
 */
export function toCodeVariants(
  variants: CodeVariant[] | Record<string, string> | undefined,
): CodeVariant[] {
  if (!variants) return [];
  if (Array.isArray(variants)) return variants;
  return Object.entries(variants).map(([language, code]) => ({ language, code }));
}
