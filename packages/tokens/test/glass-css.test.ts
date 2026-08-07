import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * THE PREFIX-ORDER GATE.
 *
 * This exists because of the most expensive kind of bug this repo can ship: one
 * where the source is correct, every test is green, and the browser silently
 * does nothing.
 *
 * `glass.css` used to author the pair standard-first:
 *
 *     backdrop-filter: blur(var(--glass-blur)) saturate(1.6);
 *     -webkit-backdrop-filter: blur(var(--glass-blur)) saturate(1.6);
 *
 * The CSS pipeline (Lightning CSS, reached through both Tailwind v4 and Next)
 * treats the two spellings as ONE logical property and keeps whichever comes
 * last — so the only declaration that reached the served stylesheet was the
 * `-webkit-` one. Chrome removed that alias around v150:
 * `CSS.supports('-webkit-backdrop-filter', 'blur(1px)')` is now `false`.
 *
 * Net effect: **no glass in the system blurred at all in current Chrome.** Not
 * `.glass-surface-blur`, and not the six tier-O overlays that are supposed to
 * be the whole point of the tier. Nothing caught it — a blur is not a colour,
 * so no contrast gate has an opinion, and the reduced-transparency and
 * `@supports` fallbacks both fail to fire (that condition asks whether the
 * BROWSER supports blur, which it does, not whether our rule survived the
 * build).
 *
 * Tailwind's own generated `.backdrop-filter` utility writes `-webkit-` first
 * and never had the bug. So: **`-webkit-` first, standard last, always.**
 *
 * Assertions are on the SOURCE rather than on built output, deliberately — the
 * source order is the thing a future edit gets wrong, and asserting it here
 * means the failure names the actual mistake instead of a missing pixel.
 */
const here = dirname(fileURLToPath(import.meta.url));
const raw = readFileSync(join(here, '../css/glass.css'), 'utf8');

/** Comments strip first: this file documents the rule in prose it must not match. */
const css = raw.replace(/\/\*[\s\S]*?\*\//g, '');

/** `selector { … }` pairs, flat — glass.css nests only inside `@media`/`@supports`. */
function rules(): { selector: string; body: string }[] {
  const out: { selector: string; body: string }[] = [];
  const re = /([^{}]+)\{([^{}]*)\}/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(css))) {
    const selector = m[1]!.trim().replace(/\s+/g, ' ');
    // Skip the at-rule preludes themselves; their inner rules match separately.
    if (selector.startsWith('@')) continue;
    out.push({ selector, body: m[2]! });
  }
  return out;
}

describe('backdrop-filter prefix order survives the CSS pipeline', () => {
  const withBackdrop = rules().filter((r) => /backdrop-filter\s*:/.test(r.body));

  it('finds the rules that declare a backdrop-filter at all', () => {
    /** A sanity check on the parser: if this drops to 0 the suite below is vacuous. */
    expect(withBackdrop.length, 'no backdrop-filter rules parsed out of glass.css').toBeGreaterThan(
      0,
    );
  });

  for (const rule of withBackdrop) {
    describe(rule.selector, () => {
      const webkit = rule.body.indexOf('-webkit-backdrop-filter:');
      const standard = rule.body.search(/(^|[^-])backdrop-filter\s*:/);

      it('declares BOTH spellings', () => {
        expect(webkit, `${rule.selector} is missing -webkit-backdrop-filter`).toBeGreaterThan(-1);
        expect(
          standard,
          `${rule.selector} is missing the unprefixed backdrop-filter`,
        ).toBeGreaterThan(-1);
      });

      it('writes -webkit- FIRST, so the standard property is the one that survives', () => {
        expect(
          webkit,
          `${rule.selector} declares the unprefixed backdrop-filter BEFORE the -webkit- one.\n\n` +
            `The build keeps only the LAST of the two, so this ships -webkit-backdrop-filter ` +
            `alone — and Chrome dropped that alias at ~v150. The rule would compute to ` +
            `\`backdrop-filter: none\` with no fallback firing and no other test failing.\n\n` +
            `Swap the two lines.`,
        ).toBeLessThan(standard);
      });
    });
  }

  it('covers every class that is supposed to blur', () => {
    /**
     * Order is only half of it — a new blurring class that never got the
     * `-webkit-` line at all would pass every assertion above by being absent.
     */
    const blurring = withBackdrop
      .filter((r) => /backdrop-filter:\s*blur/.test(r.body))
      .map((r) => r.selector)
      .join(' | ');
    for (const cls of ['.glass', '.glass-surface-blur']) {
      expect(blurring, `${cls} no longer declares a blur`).toContain(cls);
    }
  });
});
