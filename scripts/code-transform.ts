/**
 * The TypeScript → JavaScript half of the docs' language selector, and the one
 * place that decides whether a given snippet HAS a JavaScript half at all.
 *
 * Every code block in the docs offers TypeScript first and JavaScript second.
 * The JavaScript is not written , it is DERIVED, here, at build time, from the
 * same source the TypeScript tab shows. That direction is the whole point: an
 * authored second copy is a second thing to keep correct, and the failure mode
 * is a JS tab that quietly drifts from the TS tab it claims to be a translation
 * of. Nobody notices, because nobody reads both.
 *
 * ## Why the compiler, and not a regex
 *
 * Stripping types looks like a text problem right up until a generic argument
 * spans a line, a `satisfies` shows up inside JSX, or a parameter property hides
 * in a constructor. `ts.transpileModule` is the same emitter `tsc` uses, minus
 * the type checker , it parses the file properly and it is fast enough to run on
 * ~150 payloads without anyone noticing the build got slower.
 *
 * ## The four compiler options that are load-bearing
 *
 *   jsx: Preserve            The reader came to look at JSX. Emitting
 *                            `_jsx(...)` calls would be a correct translation of
 *                            something nobody writes by hand.
 *   removeComments: false    The examples' comments ARE the teaching , half of
 *                            what a snippet says lives in the line above it.
 *   isolatedModules: true    States the truth about what this is: one file,
 *                            transpiled with no program and no cross-file
 *                            knowledge. It also makes the emitter refuse the
 *                            constructs that need type information rather than
 *                            guessing at them.
 *   verbatimModuleSyntax: true
 *                            See below. It is the same value `tsconfig.base.json`
 *                            sets, and it is not interchangeable with `false`.
 *
 * ## ⚠️ `verbatimModuleSyntax` must be TRUE, and the reason is not obvious
 *
 * Both settings elide `import type { X } from '…'`, which is the thing you
 * actually want gone , a JS consumer never writes that line. The difference is
 * what happens to a value import that this file does not appear to USE.
 *
 * With `false`, the emitter drops it. And "appears to use" is decided by a
 * syntactic pass over ONE file with no type checker behind it, which puts two
 * classes of payload in the docs at risk:
 *
 *   - The `content.ts` usage snippets are fragments. `pagination` imports five
 *     names and demonstrates one; under `false` its JavaScript tab shows a
 *     one-name import that the reader would copy and then wonder why nothing
 *     renders. Four of the five names the snippet exists to show simply vanish.
 *     A snippet that is NOTHING but import lines , and there are docs blocks
 *     whose entire point is an import path , collapses all the way to the
 *     literal string `export {};`.
 *   - A real component fares worse, not better. `code-block.tsx` imports
 *     `resolveCodeLanguage` and uses it; the single-file emit dropped the whole
 *     import line anyway, producing a JS tab that is not merely untidy but
 *     BROKEN , code that references a binding it never imported.
 *
 * With `true` nothing that carries no `type` modifier is ever removed, so the JS
 * rendering always has at least the imports the TS rendering had. The cost is an
 * occasional unused import , a name used only in a type annotation stays behind
 * after the annotation goes , which is a cosmetic blemish rather than a lie. A
 * one-directional trade, and it is the direction where being wrong is survivable.
 *
 * It also happens to be the honest setting: `tsconfig.base.json` turns
 * `verbatimModuleSyntax` on repo-wide, so this is how every source shown in these
 * docs is really compiled. Emitting under `false` would be documenting a build
 * nobody runs.
 *
 * ## Why Prettier runs afterwards
 *
 * The emitter's output is valid but not idiomatic: it collapses some blank lines
 * (reliably the one after a `'use client';` directive), leaves the indentation of
 * the removed annotation behind, and does not re-wrap an import list that just
 * got shorter. All cosmetic, all distracting in a tab whose only job is to be
 * read. Prettier renormalises it to exactly the shape the repo's own `.prettierrc`
 * would produce, so the two tabs differ only where the languages differ.
 *
 * The options are passed EXPLICITLY rather than discovered. There is no real file
 * on disk for these strings , several are fragments assembled in memory , so
 * config resolution has no path to walk up from, and a silent fallback to
 * Prettier's defaults would quietly reformat every snippet to 80 columns with
 * double quotes.
 *
 * ## Returning `null`, and why the guards live HERE
 *
 * {@link tsToJs} answers a slightly bigger question than "what is the JavaScript
 * for this". It answers "is there a JavaScript rendering of this worth showing",
 * and for a meaningful fraction of docs snippets the answer is no. Every caller
 * needs that judgement and every caller would get it subtly differently, so it is
 * one function's problem: `null` out, single-variant list in, no selector on the
 * page. The three reasons are documented on the guards themselves.
 */
import prettier from 'prettier';
import ts from 'typescript';

/**
 * `.prettierrc.json` at the repo root, spelled out.
 *
 * Duplicated deliberately: see the note above about there being no file path to
 * resolve a config from. If the root config changes, change this too , the cost
 * of the drift is a docs tab formatted unlike the source it mirrors, which is
 * cosmetic, which is why nothing can be made to fail on it.
 */
const PRETTIER_OPTIONS = {
  singleQuote: true,
  semi: true,
  printWidth: 100,
  trailingComma: 'all',
} as const;

/** Why a payload has no JavaScript variant. */
export type TransformSkip = 'bare-jsx' | 'unparsable' | 'degenerate' | 'identical';

/**
 * What {@link tsToJs} produced.
 *
 * `derived` is the honest part. `false` means the snippet had no TypeScript syntax
 * to strip , it was already JavaScript , so `code` is the source unchanged and the
 * two languages print the same characters.
 *
 * ## Why an identical rendering is still worth showing
 *
 * This reversed. The first version returned `null` for the identical case, on the
 * reasoning that a control whose options print the same characters lies about
 * having an effect. That is true in the abstract and wrong for a documentation
 * site, and the measurement is what settled it: **every one of the 48 Usage
 * snippets is import lines plus JSX**, so the selector vanished from the most
 * prominent block on every component page , which is exactly where a reader goes
 * looking for it.
 *
 * The label is itself the information. A reader who works in JavaScript wants to
 * know this snippet is usable as-is, and *"switch to JavaScript and nothing
 * changes"* answers that; an absent control does not answer it at all, it just
 * looks like the feature is missing. This is what the TypeScript/JavaScript
 * toggles in the Next.js and Vue documentation do, for the same reason.
 *
 * What is still refused is output that cannot be trusted , see the `unparsable`
 * guard. There the derived text is wrong rather than redundant, and wrong text
 * under a language label is the one outcome worse than no label.
 */
export interface TsToJsResult {
  /** The JavaScript to show. */
  code: string;
  /** `true` when types were actually stripped; `false` when it was already JS. */
  derived: boolean;
}

/**
 * Payloads whose JavaScript is character-identical to their TypeScript, in call
 * order. Reported alongside {@link skippedTransforms} so the build log
 * distinguishes *"shown, and the same"* from *"not shown"*.
 */
export const identicalTransforms: { fileName: string; reason: TransformSkip }[] = [];

/**
 * Every `null` {@link tsToJs} returned, in call order, with its reason.
 *
 * A skip is a decision, and a decision nobody can see is indistinguishable from a
 * bug. The build script reads this to print what it left out and why , which is
 * how you would notice that, say, all 48 usage snippets had quietly collapsed to
 * TypeScript-only rather than the handful you expected.
 */
export const skippedTransforms: { fileName: string; reason: TransformSkip }[] = [];

/** Empty, whitespace-only, or the bare `export {};` the emitter leaves behind. */
const NOTHING_TO_SHOW = /^(?:export\s*\{\s*\}\s*;?)?$/;

/**
 * Are these two the same code, ignoring how it is laid out?
 *
 * A plain string comparison is not enough, and the reason is a detail of the
 * emitter: it drops the blank line after an import block. So a snippet whose
 * JavaScript is character-for-character the same code comes back "different",
 * earns a second variant, and gives the reader a language selector whose only
 * observable effect is a missing blank line. That happened on 2 of 7 guide
 * blocks , common enough to be the normal case rather than an edge one.
 *
 * Semicolons are ignored for the same reason and with the same confidence. A
 * fragment written without a terminator , `cn('rounded-md px-3', …, className)`
 * on the docs page for `cn` , comes back with one, because the emitter prints
 * statements and Prettier terminates them. That is a punctuation difference, and
 * no difference that consists ONLY of semicolons and whitespace can be a
 * difference between the two languages: there is no type syntax spelled that way.
 * So collapsing them cannot hide anything the reader came to see.
 *
 * Collapsing all whitespace can in principle hide a real difference inside a
 * template literal. That is the right way to be wrong here: the question being
 * asked is "is there anything for the reader to choose between", and whitespace
 * inside a string is not it.
 */
export function sameCode(a: string, b: string): boolean {
  const normalise = (text: string): string => text.replace(/;/g, ' ').replace(/\s+/g, ' ').trim();
  return normalise(a) === normalise(b);
}

const JSX_KINDS = new Set<ts.SyntaxKind>([
  ts.SyntaxKind.JsxElement,
  ts.SyntaxKind.JsxSelfClosingElement,
  ts.SyntaxKind.JsxFragment,
]);

/**
 * Is this snippet nothing but imports and top-level JSX?
 *
 * ## Why this shape has to be caught, and caught with the parser
 *
 * A lot of documentation snippets are written as a fragment , an import line,
 * a blank line, and the JSX the reader came to see , with no component around it
 * and no `return`. Handed to the emitter, sibling JSX elements at the top level
 * are not two statements. They parse as one comma-sequence expression, and the
 * printer faithfully puts it back as one:
 *
 *   <SunIcon className="hidden dark:block" />
 *   <MoonIcon className="dark:hidden" />
 *
 * comes back as
 *
 *   ((<SunIcon className="hidden dark:block" />), (<MoonIcon className="dark:hidden" />));
 *
 * which is valid JavaScript, is not what the snippet said, and looks plausible
 * enough to ship. That is the dangerous class of failure here , the other two
 * guards catch output that is obviously nothing, this one catches output that is
 * confidently wrong.
 *
 * Skipping these is also right on the merits rather than merely defensive. JSX
 * is not TypeScript-specific: a snippet that is only imports plus JSX has no type
 * syntax to strip, so its JavaScript IS its TypeScript and the second tab would
 * have nothing to add even if the printer behaved.
 *
 * Detected through the parser rather than a regex because the distinguishing
 * feature is a parse-level fact , whether the top-level statements are
 * expression statements whose expressions are JSX , and every regex for "is this
 * line JSX" is a guess about text that a multi-line element defeats.
 */
export function isBareJsxSnippet(source: string, fileName: string): boolean {
  const sourceFile = ts.createSourceFile(
    fileName,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  );

  const body = sourceFile.statements.filter((statement) => !ts.isImportDeclaration(statement));
  if (!body.length) return false;

  return body.every((statement) => {
    if (!ts.isExpressionStatement(statement)) return false;
    // A comma sequence is how the parser reads sibling elements, so recurse
    // through it rather than rejecting it , `<A/> <B/>` is the case this exists
    // for, and it arrives as exactly that.
    const walk = (expression: ts.Expression): boolean =>
      ts.isBinaryExpression(expression) &&
      expression.operatorToken.kind === ts.SyntaxKind.CommaToken
        ? walk(expression.left) && walk(expression.right)
        : JSX_KINDS.has(expression.kind);
    return walk(statement.expression);
  });
}

/**
 * Strip the types out of one TypeScript source and hand back readable
 * JavaScript, or `null` when there is no JavaScript rendering worth showing.
 *
 * `fileName` is not opened , nothing here touches the disk. It only tells the
 * emitter and the parser which dialect to read (a `.tsx` name turns JSX on) and
 * labels the entry in {@link skippedTransforms}, so pass something identifying
 * even for a snippet that only ever existed as a string.
 *
 * ## Never throws
 *
 * A snippet that cannot be FORMATTED still gets returned , transpiled but
 * unformatted , and still goes through the remaining guards. Prettier's `babel`
 * parser is stricter than the TypeScript parser about a few shapes that the
 * emitter was happy with, and a failure there is a statement about presentation,
 * not about correctness. The right outcome is a JS tab with untidy whitespace,
 * not a build that fell over on the formatting of a code sample.
 *
 * Note that this catches strictly less than it used to: anything the TypeScript
 * parser itself objected to has already been turned away by the `unparsable`
 * guard, which is the stronger and earlier check.
 */
export async function tsToJs(source: string, fileName: string): Promise<TsToJsResult | null> {
  /** Refuse outright. Reserved for output that would be WRONG, not merely equal. */
  const skip = (reason: TransformSkip): null => {
    skippedTransforms.push({ fileName, reason });
    return null;
  };

  /**
   * The snippet is already JavaScript, so the JavaScript rendering is the source
   * itself , NOT the emitter's output. That distinction is load-bearing for
   * `bare-jsx`: two sibling JSX elements come back from the emitter as a
   * comma-sequence expression, so the *derived* text is mangled while the
   * *source* is perfectly good JavaScript that needs no transform at all.
   */
  const asIs = (reason: TransformSkip): TsToJsResult => {
    identicalTransforms.push({ fileName, reason });
    return { code: source, derived: false };
  };

  // Checked on the INPUT, before the emitter gets a chance to mangle it, because
  // this guard is a statement about the shape the snippet was written in. It
  // runs FIRST so that the multi-root JSX fragment , which the parser also
  // complains about , is reported as the shape it is rather than as a syntax
  // error, which is the more useful thing to read in the build log.
  if (isBareJsxSnippet(source, fileName)) return asIs('bare-jsx');

  const transpiled = ts.transpileModule(source, {
    compilerOptions: {
      target: ts.ScriptTarget.ESNext,
      module: ts.ModuleKind.ESNext,
      jsx: ts.JsxEmit.Preserve,
      isolatedModules: true,
      removeComments: false,
      verbatimModuleSyntax: true,
    },
    fileName,
    reportDiagnostics: true,
  });

  /*
   * ## The source did not parse, so nothing derived from it can be trusted
   *
   * `transpileModule` never fails , it recovers from a parse error, drops what it
   * could not read, and prints the rest. For real code that never comes up. For
   * documentation it comes up twice in this repo, and both times the recovery
   * produced something worse than nothing:
   *
   *   {paginationRange({ page, pageCount }).map((slot) => …)}
   *
   * uses `…` as "and so on", which is not a character JavaScript has. The emitter
   * dropped it and printed `.map((slot) => );` , a snippet that now says nothing
   * and does not run. And the `kbd` page's snippet mixes prose with JSX
   * (`Open the palette <Kbd>⌘</Kbd>`), which the parser reads as a chain of
   * identifiers and a less-than comparison and reprints as `Open; the; palette;`.
   *
   * Neither is a JavaScript rendering of anything. Both look plausible enough at a
   * glance to ship. So a diagnostic , any diagnostic , means no variant.
   *
   * This runs on OUR payloads only, all of which are either real compiled sources
   * or hand-written snippets, so a diagnostic here is always the snippet being
   * illustrative rather than executable. It fires on zero of the examples and zero
   * of the registry files.
   */
  if (transpiled.diagnostics?.length) return skip('unparsable');

  let derived: string;
  try {
    derived = (
      await prettier.format(transpiled.outputText, { parser: 'babel', ...PRETTIER_OPTIONS })
    ).trimEnd();
  } catch {
    derived = transpiled.outputText.trimEnd();
  }

  if (NOTHING_TO_SHOW.test(derived.trim())) return asIs('degenerate');
  if (sameCode(source, derived)) return asIs('identical');

  return { code: derived, derived: true };
}
