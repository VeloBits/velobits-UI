/**
 * The join between a fenced code block in an `.mdx` guide and the variants the
 * build derived for it.
 *
 * ## Why a content hash, and not a position
 *
 * The guide pages are MDX, so their fenced blocks are compiled by Next rather
 * than read by our codegen. That means the two halves of this feature never meet:
 * `scripts/build-guide-code.ts` sees `app/docs/dark-mode/page.mdx` line 20, while
 * the `pre` override in `mdx-components.tsx` sees a React element with a string
 * inside it and no idea where that string came from. MDX passes no position data
 * to element overrides.
 *
 * A file-and-line key is therefore unavailable at render time, which leaves the
 * content itself as the only thing both halves hold. Hashing it means a block is
 * looked up by what it says , so a guide can be reordered, split or renamed and
 * nothing needs regenerating beyond the usual build.
 *
 * The happy side effect: two blocks that show the same code share one entry.
 *
 * ## Why not `node:crypto`
 *
 * This module is imported by the build script AND by `mdx-components.tsx`, which
 * is part of the page graph. Pulling a Node builtin into that graph is asking for
 * a bundling problem in exchange for cryptographic strength nobody needs , the
 * input set is ~35 strings that live in this repository. FNV-1a is eight lines and
 * runs identically in both places, which is the only property that matters here.
 *
 * Collisions are not merely improbable, they are *caught*: the build fails when
 * two different blocks hash alike, so the failure mode is a red build rather than
 * a guide page quietly showing another page's code. The length suffix makes that
 * gate essentially unreachable.
 */

/**
 * Trim a fenced block's text to exactly what the build hashed.
 *
 * MDX hands the `pre` override the block's contents with a trailing newline that
 * the source fence does not visibly have, and our scanner reads the raw lines
 * between the fences. Normalising both sides through this one function is what
 * keeps them in agreement , the whole mechanism turns on the two halves agreeing
 * about whitespace, so neither side is allowed its own idea of it.
 */
export function normalizeGuideCode(raw: string): string {
  return raw.replace(/\r\n/g, '\n').replace(/\s+$/, '');
}

/**
 * A stable, short key for a block's contents.
 *
 * FNV-1a, 32-bit, base36, with the normalised length appended. The length is not
 * decoration: it makes a collision require two strings that hash alike *and*
 * measure the same, which is what lets the build's collision check be a
 * formality rather than a live risk.
 */
export function guideCodeKey(raw: string): string {
  const code = normalizeGuideCode(raw);
  let hash = 0x811c9dc5;
  for (let i = 0; i < code.length; i += 1) {
    hash ^= code.charCodeAt(i);
    /*
     * The FNV prime as shifts+adds rather than `* 16777619`, and `>>> 0` to stay
     * in unsigned 32-bit. A plain multiply overflows into a double at these
     * magnitudes, and a double's rounding is not the same on every engine , which
     * would make the key depend on where it was computed. That is precisely the
     * bug this function cannot have.
     */
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  return `${hash.toString(36)}${code.length.toString(36)}`;
}
