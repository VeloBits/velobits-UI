/*
 * `@velobitsio/ui/cn`, not the barrel.
 *
 * This is a Server Component, and the barrel is bundled with a `'use client'`
 * banner , so importing `cn` from it and CALLING it fails the build with
 * "Attempted to call cn() from the server but cn is on the client". Rendering a
 * client component from here is fine; invoking a function out of a client module
 * is not.
 *
 * `cn` and `theme` are built as a separate, un-bannered tsup entry for exactly
 * this: they are React-free and callable during server render. The subpath is the
 * whole point of that split.
 *
 * That rule is also what decides the shape of the split with
 * `code-panel-switcher.tsx`. Every class string a panel needs is composed HERE,
 * on the server, and handed to the switcher as a plain string prop. The switcher
 * is a client module and may call `cn` freely; this file may not, and the two may
 * not share a helper in the other direction , importing a function out of
 * `'use client'` code and calling it during server render is the failure above,
 * with a different name on it.
 */
import { cn } from '@velobitsio/ui/cn';

import { CodePanelSwitcher } from './code-panel-switcher';
import { CopyButton } from './copy-button';

/**
 * One rendering of a code payload, in one language.
 *
 * Structurally the `DocCodeVariant` that `scripts/build-docs-data.ts` writes into
 * each of `lib/generated/{examples,registry-data,content}.ts`. It is declared
 * here rather than imported from one of them on purpose: the generator mirrors
 * the interface into all three outputs so each generated file reads on its own,
 * which leaves no single module to import it from , and picking one of the three
 * arbitrarily would make this component, which is chrome, depend on whichever
 * generated file happened to be chosen. The shapes are identical, so all three
 * flow into `variants` without a cast.
 *
 * The field is `code`, not `source`, because it mirrors `CodeVariant` in
 * `registry/velobits/lib/code-languages.ts`, which is the contract the library's
 * own `CodeBlock` consumes. Two names for the same string is how the two halves
 * drift.
 */
export interface DocCodeVariant {
  /** A `CODE_LANGUAGES` id: `'ts' | 'js' | 'css' | …`. */
  language: string;
  /** The literal code, for the copy button. */
  code: string;
  /** Shiki markup for `code`, built at build time. */
  html: string;
}

/**
 * A block of code that was highlighted at build time by
 * `scripts/build-docs-data.ts`, in every language the build could produce it in.
 *
 * `dangerouslySetInnerHTML` is load-bearing and safe here: the markup is Shiki's
 * output for a file in this repository, produced during the build. Nothing on
 * this page is ever user input, and there is no runtime path that reaches this
 * prop , the alternative, shipping the highlighter to the browser, costs every
 * reader a megabyte of grammars to render text that never changes.
 *
 * The dual-theme CSS lives in `app/globals.css`: Shiki emits `--shiki-light` and
 * `--shiki-dark` per token rather than a baked colour, so one payload serves both
 * themes and the code recolours with the rest of the page rather than after it.
 * That is per PAYLOAD, not per panel , adding a language adds a variant, never a
 * second highlight pass over the same variant.
 *
 * ## Why one variant is not the same component as two
 *
 * `variants` arrives ordered, and **`variants[0]` is the default language**. A
 * block with one entry has no choice to offer, so it renders the markup and a
 * copy button and stops , the same DOM this component emitted before language
 * selection existed, and still reachable without a client component. That is not
 * an optimisation, it is the correctness case: the CSS usage snippet and every
 * hand-authored single-language block must not grow a selector reading "CSS" next
 * to no alternative, and must not start hydrating to say so.
 *
 * Two or more variants hand off to {@link CodePanelSwitcher}, which is a client
 * component because a choice is state. Everything measured below still applies to
 * it: the class strings are composed here and passed down, so there is exactly
 * one copy of them.
 */
export function CodePanel({
  variants,
  label,
  className,
  maxHeight,
  blockId,
}: {
  /** Ordered; the first entry is the default language. */
  variants: DocCodeVariant[];
  label?: string;
  className?: string;
  /** Caps the height and scrolls, for a full component source. */
  maxHeight?: string;
  /**
   * Identity for this block's language selection, forwarded to the switcher and
   * reported back through its `onLanguageChange`. A page holds many code blocks
   * and each keeps its own language, so a caller that intends to lift that state
   * later wants a key it chose , `install:src/ui/button.tsx` , rather than the
   * `useId()` value the switcher falls back to, which is stable across renders
   * but meaningless outside the component. It is a state key and never a DOM id.
   */
  blockId?: string;
}) {
  /*
   * The selector occupies the block's top-right corner, so the code has to start
   * below it. `[&_pre]:pt-12` is that reservation , see the `pt-12` note further
   * down for why the padding goes on the `<pre>` and not on the wrapper.
   */
  const hasSelector = variants.length > 1;

  const wrapperClassName = cn(
    'group/code relative overflow-hidden rounded-lg border border-border',
    className,
  );

  const codeClassName = cn(
    'text-[0.8125rem] leading-relaxed',
    /*
     * ⚠️ The `<pre>` is the scroll container, NOT this wrapper.
     *
     * Shiki paints the block's background on the `<pre>` (as
     * `--shiki-*-bg`), and a background only ever covers the element's own
     * box. A `<pre>` is a block, so inside a scrolling wrapper it is exactly
     * as wide as that wrapper , meaning the moment you scrolled right, the
     * code ran off the end of its own fill and the page showed through, with
     * a matching strip under the horizontal scrollbar, which belongs to the
     * wrapper and never had the fill at all.
     *
     * Scrolling the painted element instead fixes both: its background is
     * the padding box, which is what stays put while the content moves, and
     * the scrollbar gutter is inside it. `w-max` on the `<pre>` would fix
     * only the first half.
     */
    '[&_pre]:overflow-auto [&_pre]:p-4 [&_pre]:font-mono',
    /*
     * Shiki's own output already carries `tabindex="0"`, so the element that
     * scrolls is the element that focuses (2.1.1) with nothing added here.
     * The offset goes INWARD because the rounded wrapper clips overflow, and
     * a 2px outline drawn outside the `<pre>` is a 2px outline nobody sees.
     */
    '[&_pre]:focus-visible:-outline-offset-2',
    /*
     * Room for the control strip, on the `<pre>` because the `<pre>` is what
     * scrolls: padding on the wrapper would sit OUTSIDE the scrolling box, so a
     * long first line would still travel under the controls as soon as the reader
     * scrolled right. Padding inside the scroll container moves with the content
     * and keeps that lane empty at every scroll offset.
     *
     * `p-4 pt-12` and not a single `pt-12`: Tailwind orders the shorthand before
     * the per-side utility, and `cn`'s merge keeps both because `pt` does not
     * cover `p`. 3rem clears the 8px inset plus the ~30px control row with a line
     * of air; the copy button alone (1.75rem) never needed it, which is why the
     * single-variant path does not get it.
     */
    hasSelector && '[&_pre]:pt-12',
    maxHeight && '[&_pre]:max-h-[var(--code-panel-max-h)]',
  );

  if (hasSelector) {
    return (
      <CodePanelSwitcher
        variants={variants}
        label={label}
        blockId={blockId}
        wrapperClassName={wrapperClassName}
        codeClassName={codeClassName}
        maxHeight={maxHeight}
      />
    );
  }

  const only = variants[0];

  /*
   * No variants is not a rendering problem to paper over: an empty bordered box
   * reads as a broken component, and there is nothing to show or copy. The
   * generator fails the build long before this on a payload it could not read, so
   * this is a type-level floor rather than a case anyone should hit.
   */
  if (!only) return null;

  return (
    <div className={wrapperClassName}>
      <CopyButton
        value={only.code}
        label={label ? `Copy ${label}` : 'Copy code'}
        className="absolute end-2 top-2 z-raised bg-panel/80 backdrop-blur-sm"
      />
      <div
        role={label ? 'region' : undefined}
        aria-label={label}
        className={codeClassName}
        style={maxHeight ? ({ '--code-panel-max-h': maxHeight } as React.CSSProperties) : undefined}
        dangerouslySetInnerHTML={{ __html: only.html }}
      />
    </div>
  );
}
