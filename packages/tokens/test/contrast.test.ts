import { describe, expect, it } from 'vitest';

import { compositeOver, contrastRatio, round2 } from '../src/color';
import { GLASS_ALPHA_FLOOR, glass } from '../src/glass';
import { worstCaseBackdrops } from '../src/palette';
import { themes, type SemanticTokens, type ThemeName } from '../src/semantic';
import {
  CONTRAST_EXEMPT,
  CONTRAST_PAIRS,
  TARGET,
  resolvePair,
  type ContrastPair,
} from '../src/contrast-pairs';

/**
 * THE HEADLINE GATE.
 *
 * Every documented semantic pairing is asserted against its WCAG target in both
 * themes, and every glass tier against the seven worst-case backdrops in the
 * palette. A palette edit that breaks contrast fails here rather than shipping.
 *
 * If you are here because a test went red: the fix is almost never to lower a
 * target. Adjust the token, or add a new step to the ramp the way `neutral-750`
 * and `--muted-on-glass` were both added for exactly this reason.
 */

const THEMES: ThemeName[] = ['light', 'dark'];

/** Skip translucent values — a contrast ratio needs an opaque colour. */
const isOpaqueHex = (v: string) => /^#[0-9a-fA-F]{6}$/.test(v);

describe('semantic pairs meet their WCAG target', () => {
  for (const theme of THEMES) {
    describe(theme, () => {
      for (const pair of CONTRAST_PAIRS) {
        const resolved = resolvePair(pair, theme);
        if (!resolved) continue;

        const suffix = pair.note ? ` — ${pair.note}` : '';
        it(`${pair.label} (≥${TARGET[pair.target]}:1)${suffix}`, () => {
          const ratio = contrastRatio(resolved.fg, resolved.bg);
          expect(
            ratio,
            `${pair.fg} (${resolved.fg}) on ${pair.bg} (${resolved.bg}) = ${round2(ratio)}:1, ` +
              `needs ≥${resolved.target}:1`,
          ).toBeGreaterThanOrEqual(resolved.target);
        });
      }
    });
  }
});

describe('no semantic token escapes measurement', () => {
  /**
   * The loophole this closes: adding a colour token and simply not adding a
   * contrast pair for it. Every key of SemanticTokens must appear as the `fg` of
   * at least one pair, or carry a written exemption.
   */
  const measured = new Set<string>(CONTRAST_PAIRS.map((p: ContrastPair) => p.fg));

  for (const key of Object.keys(themes.light) as (keyof SemanticTokens)[]) {
    it(`${key} is either contrast-gated or has a documented exemption`, () => {
      const covered = measured.has(key) || key in CONTRAST_EXEMPT;
      expect(
        covered,
        `Token "${key}" is neither the foreground of a CONTRAST_PAIRS entry nor listed ` +
          `in CONTRAST_EXEMPT. Add a pair, or add an exemption WITH A REASON.`,
      ).toBe(true);
    });
  }

  it('every exemption refers to a token that still exists', () => {
    const live = new Set(Object.keys(themes.light));
    const stale = Object.keys(CONTRAST_EXEMPT).filter((k) => !live.has(k));
    expect(stale, `CONTRAST_EXEMPT lists tokens that no longer exist: ${stale.join(', ')}`).toEqual(
      [],
    );
  });
});

describe('the specific claims the palette was designed around', () => {
  /**
   * These are not redundant with the pair sweep — they are the measurements the
   * palette's *shape* rests on. If any of them moves, a documented design
   * decision has silently changed meaning.
   */
  it('blue fails as text on cream, which is why --primary-text exists', () => {
    // 3.90:1 — the whole reason `primary` is a fill-only token.
    expect(round2(contrastRatio('#007ACC', '#F4EDEA'))).toBe(3.9);
    expect(contrastRatio('#007ACC', '#F4EDEA')).toBeLessThan(TARGET.text);
  });

  it('blue works as a fill with white on it', () => {
    expect(round2(contrastRatio('#FFFFFF', '#007ACC'))).toBe(4.51);
  });

  it('lime is text-safe ONLY against charcoal', () => {
    expect(round2(contrastRatio('#C8F135', '#2A2B2A'))).toBe(10.89);
    // White on lime is the mistake this number exists to forbid.
    expect(round2(contrastRatio('#FFFFFF', '#C8F135'))).toBe(1.31);
    // And lime is never text, never a border, never a focus ring in light mode.
    expect(round2(contrastRatio('#C8F135', '#F4EDEA'))).toBe(1.13);
  });

  it('a lime fill cannot be a lone graphical indicator in light mode', () => {
    /**
     * 1.13:1 against the cream page — far below the 3:1 that WCAG 1.4.11 asks of
     * a graphical object conveying information. So in LIGHT mode:
     *
     *   fine    a badge or button, where the charcoal text inside (10.89:1) is
     *           what identifies the element
     *   NOT fine a status dot, an indicator bar, an unlabelled chart mark — any
     *           lime shape that is the only carrier of meaning. Those need an
     *           outline or a darker companion colour.
     *
     * In dark mode the same fill measures 13.24:1 and has no such restriction,
     * which is why the `brand fill vs page` pair above is dark-only.
     */
    expect(contrastRatio(themes.light.brand, themes.light.bg)).toBeLessThan(TARGET.nonText);
    expect(contrastRatio(themes.dark.brand, themes.dark.bg)).toBeGreaterThanOrEqual(TARGET.nonText);
    // The escape hatch that makes a lime indicator legal in light mode.
    expect(contrastRatio(themes.light.fieldBorder, themes.light.bg)).toBeGreaterThanOrEqual(
      TARGET.nonText,
    );
  });

  it('plum is a dark SURFACE, not a dark accent', () => {
    expect(round2(contrastRatio('#592941', '#2A2B2A'))).toBe(1.23);
    // Its real light-mode job:
    expect(round2(contrastRatio('#582840', '#F4EDEA'))).toBe(10.12);
  });

  it('the blue text steps clear AA in their own theme', () => {
    expect(contrastRatio('#006CBD', '#F4EDEA')).toBeGreaterThanOrEqual(TARGET.text);
    expect(contrastRatio('#42A4F9', themes.dark.bg)).toBeGreaterThanOrEqual(TARGET.text);
  });

  it('field-border clears 1.4.11 in BOTH themes from a single value', () => {
    // The property that let one token serve both themes; if a future edit
    // breaks it, the two need to split again.
    expect(themes.light.fieldBorder).toBe(themes.dark.fieldBorder);
    for (const theme of THEMES) {
      const t = themes[theme];
      expect(contrastRatio(t.fieldBorder, t.panel)).toBeGreaterThanOrEqual(TARGET.nonText);
      expect(contrastRatio(t.fieldBorder, t.bg)).toBeGreaterThanOrEqual(TARGET.nonText);
    }
  });
});

describe('glass tiers stay legible over every worst-case backdrop', () => {
  /**
   * Composited in GAMMA-encoded sRGB, which is what browsers do. Measuring this
   * in linear light reports a white glass over charcoal as ~38 8-bit steps
   * lighter and flips failing muted text into passing — see the note on
   * `compositeOver`.
   */
  const tiers: [name: keyof typeof glass, theme: ThemeName][] = [
    ['light', 'light'],
    ['dark', 'dark'],
    ['darkElevated', 'dark'],
  ];

  for (const [tierName, theme] of tiers) {
    const tier = glass[tierName];

    it(`${tierName}: alpha ${tier.alpha} is at or above the measured floor`, () => {
      expect(tier.alpha).toBeGreaterThanOrEqual(GLASS_ALPHA_FLOOR);
    });

    for (const backdrop of worstCaseBackdrops) {
      const surface = compositeOver(tier.surface, backdrop, tier.alpha);

      it(`${tierName}: body text over ${backdrop} (composite ${surface})`, () => {
        const ratio = contrastRatio(themes[theme].fg, surface);
        expect(ratio, `${round2(ratio)}:1 — needs ≥${TARGET.text}:1`).toBeGreaterThanOrEqual(
          TARGET.text,
        );
      });

      it(`${tierName}: muted-on-glass over ${backdrop} (composite ${surface})`, () => {
        const ratio = contrastRatio(themes[theme].mutedOnGlass, surface);
        expect(ratio, `${round2(ratio)}:1 — needs ≥${TARGET.text}:1`).toBeGreaterThanOrEqual(
          TARGET.text,
        );
      });
    }
  }

  it('the ordinary muted token is NOT safe on glass — this is why mutedOnGlass exists', () => {
    /**
     * A guard against someone "simplifying" the two tokens back into one.
     *
     * Note the failure is a WORST-CASE result, not a lime-specific one: over a
     * lime backdrop `mutedFg` actually measures a comfortable 5.40:1, and it is
     * the DARK backdrops that sink it to 3.09:1 — a white glass at the alpha
     * floor over near-black is still translucent enough for the page to darken
     * it. Testing only the most colourful backdrop would have reported this pair
     * as safe.
     */
    for (const [theme, tier] of [
      ['light', glass.light],
      ['dark', glass.dark],
    ] as const) {
      const worst = (fg: string) =>
        Math.min(
          ...worstCaseBackdrops.map((bd) =>
            contrastRatio(fg, compositeOver(tier.surface, bd, GLASS_ALPHA_FLOOR)),
          ),
        );
      expect(worst(themes[theme].mutedFg), `${theme}: mutedFg`).toBeLessThan(TARGET.text);
      expect(worst(themes[theme].mutedOnGlass), `${theme}: mutedOnGlass`).toBeGreaterThanOrEqual(
        TARGET.text,
      );
    }
  });

  it('glass borders are the ONLY translucent line tokens', () => {
    for (const theme of THEMES) {
      expect(isOpaqueHex(themes[theme].border)).toBe(true);
      expect(isOpaqueHex(themes[theme].fieldBorder)).toBe(true);
    }
    for (const tier of Object.values(glass)) {
      expect(tier.border.startsWith('rgba(')).toBe(true);
    }
  });
});
