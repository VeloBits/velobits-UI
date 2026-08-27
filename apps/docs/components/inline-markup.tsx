import type { ReactNode } from 'react';

/**
 * The smallest possible inline renderer: `` `code` ``, `**bold**` and
 * `{@link Thing}`. Not a markdown parser, and deliberately not one.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ## WHY THIS EXISTS
 *
 * Two channels on every component page carry prose that *looks* like markdown
 * and was rendered as plain text, so the punctuation printed literally:
 *
 *  - **Prop descriptions**, which are the JSDoc from the source. Across the
 *    current tree that is **181 code spans and 7 bold spans in 99
 *    descriptions** , every one of them previously showing its backticks.
 *  - **The `notes` array** in `content/components.ts`, plus an example's
 *    `description`. 25 of 77 notes contain backticks.
 *
 * The defect was invisible while the props table overflowed horizontally,
 * because the description column was off screen. Widening it surfaced this.
 *
 * ⚠️ **The same array once shipped four literal `&apos;` entities** for the
 * same reason , it is typed `string`, it looks like markup, and it is neither.
 * That is now half-true rather than false: these three forms work, and nothing
 * else does. Write prose, not markdown.
 *
 * ## Why not a markdown library
 *
 * Because the input is not markdown and never was. Turning it into markdown
 * means `_` in a prop name becomes emphasis, a line starting `-` becomes a
 * list, and `<div>` in a description becomes an element , all of which appear
 * in these strings today. A three-token allowlist cannot do that.
 * ─────────────────────────────────────────────────────────────────────────────
 */

/**
 * One pass, one regex, three alternatives , which is what makes nesting a
 * non-issue: a match is consumed whole and never rescanned, so a backtick
 * inside a bold span cannot re-open a code span.
 *
 * Both content forms are single-line by construction (`[^`\n]`), so an unclosed
 * backtick degrades to literal text on that line instead of swallowing the rest
 * of the paragraph.
 */
const INLINE = /`([^`\n]+)`|\*\*([^*\n]+)\*\*|\{@link\s+([^}\s]+)[^}]*\}/g;

export function InlineMarkup({ text }: { text: string }) {
  const out: ReactNode[] = [];
  let cursor = 0;

  // `matchAll` rather than `exec`, so there is no `lastIndex` to reset and the
  // module-level regex cannot leak state between calls or between renders.
  for (const match of text.matchAll(INLINE)) {
    const at = match.index;
    if (at > cursor) out.push(text.slice(cursor, at));

    const [whole, code, bold, link] = match;
    if (code !== undefined) {
      out.push(
        <code key={at} className="rounded bg-bg2 px-1 py-0.5 font-mono text-[0.85em] text-fg">
          {code}
        </code>,
      );
    } else if (bold !== undefined) {
      out.push(
        <strong key={at} className="font-semibold text-fg">
          {bold}
        </strong>,
      );
    } else {
      // `{@link Foo}` is a TSDoc reference. There is nothing to link to here ,
      // the target is a type, not a page , so it renders as the name it names.
      out.push(
        <code key={at} className="rounded bg-bg2 px-1 py-0.5 font-mono text-[0.85em] text-fg">
          {link}
        </code>,
      );
    }

    cursor = at + whole.length;
  }

  if (cursor < text.length) out.push(text.slice(cursor));

  return <>{out}</>;
}
