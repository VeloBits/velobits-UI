/**
 * Generates `src/generated/neutrals.ts`. Run with `npm run generate -w @velobitsio/tokens`.
 *
 * ## The rule
 *
 * The warm neutral ramp spans paper (`#EFEDEA`) → charcoal (`#2A2B2A`) and
 * beyond, holding **one hue** and **decaying chroma toward the dark end**, so a
 * grey next to the brand lime never reads as a cold grey.
 *
 * The ladder below is the OKLCH source of truth. Three things about it are worth
 * knowing before editing:
 *
 * 1. **One hue, 74°, held down the whole column** , and both halves of that
 *    matter. This ramp used to sit at 44.9° with chroma up to 0.0086 at the
 *    light end, and it was the single biggest reason the light theme did not
 *    read as a product surface:
 *
 *      - **44.9° is pink-orange, not warm.** At L 0.9447 that hue put R 10
 *        8-bit steps above B with G sitting *below* the R..B midpoint, which is
 *        a magenta cast. A page painted with it reads as dusty beige. 74° puts
 *        the same warmth on the yellow side of orange, where a near-white reads
 *        as *paper*, and drops the spread to R−B = 5.
 *      - **The hue used to DRIFT, 44.9° → 145.5°.** The light end was pink and
 *        the dark end was green, so `--muted-fg` (a 121.6° green-grey) sat on a
 *        44.9° pink page. Two near-complementary low-chroma colours do not read
 *        as "a warm palette", they read as dirt. That drift was defended on the
 *        grounds that at chroma this low the 8-bit grid is coarser than the hue
 *        difference, which is true *per step* and false *across* the ramp: the
 *        measured hue was an artefact of quantisation, but the R−B spread it
 *        recorded was real and visible.
 *
 *    The hue column is now flat, and the chroma column carries all the decay.
 *    Rows still round-trip to their committed hex byte-for-byte.
 *
 * 2. **Two steps are pinned by a light-mode contrast pair, not by ramp
 *    evenness:**
 *
 *      - `300` is light's `--border`, and dropped from L 0.845 to **0.815** to
 *        give a card outline and a table rule a real edge (1.81:1 on `--panel`,
 *        up from 1.60:1). Decorative, so WCAG 1.4.11 does not gate it , this is
 *        a design choice about how crisp the system looks.
 *      - `600` is light's `--muted-fg`, and dropped from L 0.5049 to **0.490**
 *        because `--bg2` moved down to `200` to become a visible recess. Muted
 *        text on that deeper surface measures 4.72:1; at the old L it was 4.44
 *        and failed AA. The two edits are one change , see `semantic.ts`.
 *
 *    Both steps are light-mode-only (dark uses `400` for muted text and `750`
 *    for its border), so neither move touches a dark-mode pair.
 *
 * 3. **`750` exists for one job:** the dark-mode `--border`. It has to sit
 *    *above* `--panel` (`neutral-800`) to be visible at all. The value the
 *    plan's illustrative CSS carried over from the dashboard app (`#2E2E2E`)
 *    was tuned against that app's darker `#252526` panel; against this
 *    palette's lighter `#2C2D2C` it lands at 1.02:1, i.e. invisible. `750`
 *    measures 1.15:1 against the panel , a real but quiet edge, which is what a
 *    table rule wants.
 *
 * 4. **`925` exists for one job too:** the dark-mode `--bg`. A tier-S surface
 *    has to clear 8/255 from the page below it AND from `--panel` above it, so
 *    the page↔panel distance is its entire budget. With the page at `900` that
 *    distance was 18/255, leaving a legal window of exactly three values , the
 *    glass was pinned at 9/255 either side and read as flat. `--panel` cannot
 *    move up to widen it (at #2E2F2E the gated `primary fill vs panel` pair
 *    falls to 2.98:1), so the page moved down. `925` widens the budget to
 *    23/255 and every dark contrast pair measured against the page IMPROVED ,
 *    a darker page can only help light-on-dark text. Added 2026-08-06; see
 *    ADR-0038.
 *
 * Luminance is asserted monotonic and every hex asserted round-trip-stable by
 * `test/neutrals.test.ts`, so a bad hand-edit fails CI rather than shipping.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { formatOklch, oklchToHex, relativeLuminance, type Oklch } from '../src/color';

/**
 * The one hue every step is built on. 74° , the yellow side of orange, where a
 * near-white reads as paper. See point 1 above for why it is not 44.9° any more,
 * and why it does not drift.
 */
const RAMP_HUE = 74;

/**
 * step → its OKLCH lightness and chroma. `h` is {@link RAMP_HUE} for every row;
 * a step that wants a different hue does not belong on this ramp.
 */
const LADDER: Record<string, Omit<Oklch, 'h'>> = {
  50: { l: 0.9747, c: 0.0045 },
  100: { l: 0.9447, c: 0.0045 },
  200: { l: 0.9045, c: 0.0042 },
  // L pinned by light's --border, not by ramp evenness , see point 2.
  300: { l: 0.815, c: 0.004 },
  400: { l: 0.7159, c: 0.0034 },
  500: { l: 0.6054, c: 0.003 },
  // L pinned by light's --muted-fg over the deeper --bg2 , see point 2.
  600: { l: 0.49, c: 0.0026 },
  700: { l: 0.3963, c: 0.002 },
  750: { l: 0.335, c: 0.0018 },
  800: { l: 0.2958, c: 0.0016 },
  900: { l: 0.2206, c: 0.0014 },
  925: { l: 0.1987, c: 0.0014 },
  950: { l: 0.1668, c: 0.0012 },
};

const rows = Object.entries(LADDER).map(([step, { l, c }]) => {
  const oklch: Oklch = { l, c, h: RAMP_HUE };
  const hex = oklchToHex(oklch);
  return { step, hex, oklch, luminance: relativeLuminance(hex) };
});

const banner = `/**
 * GENERATED FILE , do not edit.
 * Regenerate with: npm run generate -w @velobitsio/tokens
 * Source of truth: scripts/generate-neutrals.ts
 *
 * Warm neutral ramp: ONE hue (74°) held down the whole column, chroma decaying
 * toward the dark end, so a neutral never reads cold and never reads pink.
 */
`;

const body = `
/** Warm neutral ramp, light → dark. */
export const neutral = {
${rows.map((r) => `  ${r.step}: '${r.hex}',`).join('\n')}
} as const;

export type NeutralStep = keyof typeof neutral;

/** The OKLCH each ramp entry measures, and its WCAG relative luminance. */
export const neutralMeta = {
${rows
  .map(
    (r) =>
      `  ${r.step}: { oklch: '${formatOklch(r.oklch, 4)}', luminance: ${r.luminance.toFixed(6)} },`,
  )
  .join('\n')}
} as const;
`;

const out = join(dirname(fileURLToPath(import.meta.url)), '../src/generated/neutrals.ts');
writeFileSync(out, banner + body, 'utf8');

console.log(`wrote ${out}`);
for (const r of rows) {
  console.log(`  ${r.step.padEnd(4)} ${r.hex}  ${formatOklch(r.oklch, 4)}`);
}
