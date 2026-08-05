/**
 * Generates `src/generated/neutrals.ts`. Run with `npm run generate -w @velobits/tokens`.
 *
 * ## The rule
 *
 * The warm neutral ramp spans cream (`#F4EDEA`) → charcoal (`#2A2B2A`) and
 * beyond, holding **cream's hue** and **decaying chroma toward the dark end**,
 * so a grey next to the brand cream never reads as a cold grey.
 *
 * The ladder below is the OKLCH source of truth. Two things about it are worth
 * knowing before editing:
 *
 * 1. **The hue column drifts** from 44.9° at the light end to 145.5° at the
 *    dark end, which looks like a mistake and is not. At chroma this low
 *    (0.002-0.009) a single 8-bit step in any channel swings the measured hue by
 *    tens of degrees — the quantisation grid is coarser than the hue difference.
 *    Each row records the hue the committed hex *actually measures*, so the
 *    ladder round-trips to the same hex byte-for-byte. A smooth
 *    hue-held-at-44.89° curve produces the same colours to within 1-3 8-bit
 *    steps (visually identical), but not the same bytes, and the rest of the
 *    design system quotes these exact hexes in its contrast measurements.
 *
 * 2. **`750` exists for one job:** the dark-mode `--border`. It has to sit
 *    *above* `--panel` (`neutral-800`) to be visible at all. The value the
 *    plan's illustrative CSS carried over from ToggleFlow (`#2E2E2E`) was tuned
 *    against that app's darker `#252526` panel; against this palette's lighter
 *    `#2C2D2C` it lands at 1.02:1, i.e. invisible. `750` measures 1.15:1
 *    against the panel — a real but quiet edge, which is what a table rule
 *    wants.
 *
 * Luminance is asserted monotonic and every hex asserted round-trip-stable by
 * `test/neutrals.test.ts`, so a bad hand-edit fails CI rather than shipping.
 */
import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { formatOklch, oklchToHex, relativeLuminance, type Oklch } from '../src/color';

/** step → the OKLCH the committed hex measures. Hue drift is expected; see above. */
const LADDER: Record<string, Oklch> = {
  50: { l: 0.9747, c: 0.0085, h: 44.9 },
  100: { l: 0.9447, c: 0.0086, h: 44.9 },
  200: { l: 0.9045, c: 0.0077, h: 48.6 },
  300: { l: 0.845, c: 0.0078, h: 61.4 },
  400: { l: 0.7159, c: 0.0062, h: 84.6 },
  500: { l: 0.6054, c: 0.0059, h: 106.6 },
  600: { l: 0.5049, c: 0.0048, h: 121.6 },
  700: { l: 0.3963, c: 0.0036, h: 128.6 },
  750: { l: 0.335, c: 0.003, h: 44.9 },
  800: { l: 0.2958, c: 0.0023, h: 145.5 },
  900: { l: 0.2206, c: 0.0024, h: 145.5 },
  950: { l: 0.1668, c: 0.0026, h: 145.5 },
};

const rows = Object.entries(LADDER).map(([step, oklch]) => {
  const hex = oklchToHex(oklch);
  return { step, hex, oklch, luminance: relativeLuminance(hex) };
});

const banner = `/**
 * GENERATED FILE — do not edit.
 * Regenerate with: npm run generate -w @velobits/tokens
 * Source of truth: scripts/generate-neutrals.ts
 *
 * Warm neutral ramp: cream's hue held at the light end, chroma decaying toward
 * the dark end, so a neutral beside the brand cream never reads cold.
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
